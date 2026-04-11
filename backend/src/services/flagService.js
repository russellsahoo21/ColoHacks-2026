import mongoose from 'mongoose';
import Bed from '../models/Bed.js';
import Patient from '../models/Patient.js';
import EscalationFlag from '../models/EscalationFlag.js';
import Ward from '../models/Ward.js';
import { computeForecast } from './forecastService.js';
const logger = console;

const STALE_DISCHARGE_MS  = 2 * 3_600_000;   // 2 hours
const LONG_CLEANING_MS    = 30 * 60_000;      // 30 minutes
const CAPACITY_CRUNCH_PCT = 0.9;              // 90%

/**
 * Upsert a flag — only inserts if no open flag of this type+bed exists.
 * Returns { flag, isNew } so callers know whether to broadcast.
 */
export const upsertFlag = async (wardId, type, bedId, patientId, message) => {
  const filter = { wardId, type, bedId: bedId ?? null, resolvedAt: null };
  const setOnInsert = { wardId, type, bedId: bedId ?? null, patientId: patientId ?? null, message, triggeredAt: new Date() };

  try {
    const result = await EscalationFlag.findOneAndUpdate(
      filter,
      { $setOnInsert: setOnInsert },
      { upsert: true, new: true, rawResult: true }
    );
    return { flag: result.value, isNew: result.lastErrorObject?.upserted != null };
  } catch (err) {
    // Duplicate key from race condition — flag already exists, ignore
    if (err.code === 11000) return { flag: null, isNew: false };
    throw err;
  }
};

export const resolveFlag = async (flagId, userId) => {
  const flag = await EscalationFlag.findByIdAndUpdate(
    flagId,
    { $set: { resolvedAt: new Date(), resolvedBy: userId } },
    { new: true }
  ).lean();
  if (!flag) throw Object.assign(new Error('Flag not found'), { status: 404 });
  return flag;
};

export const getOpenFlags = (wardId) =>
  EscalationFlag.find({ wardId, resolvedAt: null })
    .populate('bedId', 'bedNumber')
    .populate('patientId', 'name conditionCategory')
    .sort({ triggeredAt: -1 })
    .lean();

export const getAllFlags = (wardId, includeResolved = false) => {
  const filter = { wardId };
  if (!includeResolved) filter.resolvedAt = null;
  return EscalationFlag.find(filter)
    .populate('bedId', 'bedNumber')
    .populate('patientId', 'name conditionCategory')
    .sort({ triggeredAt: -1 })
    .lean();
};

export const createFlag = async ({ wardId, type, bedId = null, patientId = null, message }) => {
  const validTypes = ['stale_discharge', 'long_cleaning', 'capacity_crunch', 'los_outlier'];
  if (!validTypes.includes(type)) {
    throw Object.assign(new Error(`Invalid escalation flag type '${type}'`), { status: 400 });
  }
  if (!wardId) {
    throw Object.assign(new Error('wardId is required to create an escalation flag'), { status: 400 });
  }
  if (!message || !message.trim()) {
    throw Object.assign(new Error('A descriptive message is required for the escalation flag'), { status: 400 });
  }

  return upsertFlag(wardId, type, bedId, patientId, message);
};

// ─── Check functions (called by flagJob) ──────────────────────────────────────

export const checkStaleDischarges = async () => {
  const cutoff = new Date(Date.now() - STALE_DISCHARGE_MS);
  const patients = await Patient.find({
    expectedDischarge: { $lt: cutoff },
    dischargeCompletedAt: null,
  }).lean();

  const results = [];
  for (const patient of patients) {
    const bed = await Bed.findOne({ patientId: patient._id, status: 'occupied' }).lean();
    if (!bed) continue;
    const msg = `Patient ${patient.name} flagged for discharge over 2 hours ago`;
    const result = await upsertFlag(bed.wardId, 'stale_discharge', bed._id, patient._id, msg);
    results.push(result);
  }
  return results;
};

export const checkLongCleaning = async () => {
  const cutoff = new Date(Date.now() - LONG_CLEANING_MS);
  const beds = await Bed.find({
    status: 'cleaning',
    statusChangedAt: { $lt: cutoff },
  }).lean();

  const results = [];
  for (const bed of beds) {
    const msg = `Bed ${bed.bedNumber} has been in cleaning status for over 30 minutes`;
    const result = await upsertFlag(bed.wardId, 'long_cleaning', bed._id, null, msg);
    results.push(result);
  }
  return results;
};

export const checkCapacityCrunch = async () => {
  const wards = await Ward.find({ isActive: true }).lean();
  const results = [];

  for (const ward of wards) {
    const forecast = await computeForecast(ward._id.toString());
    const pct4h = forecast.at4h.total > 0
      ? forecast.at4h.occupied / forecast.at4h.total
      : 0;

    if (pct4h >= CAPACITY_CRUNCH_PCT) {
      const msg = `Ward projected at ${Math.round(pct4h * 100)}% capacity within 4 hours`;
      const result = await upsertFlag(ward._id, 'capacity_crunch', null, null, msg);
      results.push(result);
    }
  }
  return results;
};

export const checkLosOutliers = async () => {
  const patients = await Patient.find({
    losThresholdDays: { $ne: null },
    dischargeCompletedAt: null,
    $expr: {
      $gt: [
        { $divide: [{ $subtract: [new Date(), '$admissionDate'] }, 86_400_000] },
        '$losThresholdDays',
      ],
    },
  }).lean();

  const results = [];
  for (const patient of patients) {
    const bed = await Bed.findOne({ patientId: patient._id }).lean();
    if (!bed) continue;
    const losDays = Math.floor((Date.now() - patient.admissionDate) / 86_400_000);
    const msg = `Patient ${patient.name} LOS is ${losDays} days (threshold: ${patient.losThresholdDays})`;
    const result = await upsertFlag(bed.wardId, 'los_outlier', bed._id, patient._id, msg);
    results.push(result);
  }
  return results;
};

// Auto-resolve flags that are no longer applicable
export const autoResolveStaleFlags = async () => {
  // Resolve long_cleaning flags where the bed is no longer cleaning
  const cleaningFlags = await EscalationFlag.find({ type: 'long_cleaning', resolvedAt: null }).lean();
  for (const flag of cleaningFlags) {
    const bed = await Bed.findById(flag.bedId).lean();
    if (!bed || bed.status !== 'cleaning') {
      await EscalationFlag.findByIdAndUpdate(flag._id, { $set: { resolvedAt: new Date() } });
      logger.debug(`Auto-resolved long_cleaning flag ${flag._id}`);
    }
  }

  // Resolve stale_discharge flags where discharge is now complete
  const dischargeFlags = await EscalationFlag.find({ type: 'stale_discharge', resolvedAt: null }).lean();
  for (const flag of dischargeFlags) {
    const patient = await Patient.findById(flag.patientId).lean();
    if (!patient || patient.dischargeCompletedAt) {
      await EscalationFlag.findByIdAndUpdate(flag._id, { $set: { resolvedAt: new Date() } });
      logger.debug(`Auto-resolved stale_discharge flag ${flag._id}`);
    }
  }
};
