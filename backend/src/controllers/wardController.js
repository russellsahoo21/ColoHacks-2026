import mongoose from 'mongoose';
import Ward from '../models/Ward.js';
import Bed from '../models/Bed.js';
import EscalationFlag from '../models/EscalationFlag.js';
import WardForecast from '../models/WardForecast.js';
import { assertSameWard } from '../utils/accessControl.js';
import { getHandoverReport } from '../jobs/handoverJob.js';

export const getAllWards = async (req, res, next) => {
  try {
    // Global pool - everyone can see all wards
    const [wards, bedStats] = await Promise.all([
      Ward.find({}).lean(),
      Bed.aggregate([
        {
          $group: {
            _id: '$wardId',
            total:     { $sum: 1 },
            occupied:  { $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] } },
            available: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } },
            cleaning:  { $sum: { $cond: [{ $eq: ['$status', 'cleaning'] }, 1, 0] } },
            reserved:  { $sum: { $cond: [{ $eq: ['$status', 'reserved'] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const bedMap = Object.fromEntries(bedStats.map((stats) => [stats._id.toString(), stats]));

    const enrichedWards = wards.map((ward) => {
      const stats = bedMap[ward._id.toString()] ?? {
        total: 0,
        occupied: 0,
        available: 0,
        cleaning: 0,
        reserved: 0,
      };
      const occupancyPct = stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0;
      return {
        ...ward,
        beds: stats,
        occupiedBeds: stats.occupied,
        availableBeds: stats.available,
        cleaningBeds: stats.cleaning,
        reservedBeds: stats.reserved,
        occupancyPct,
      };
    });

    res.json(enrichedWards);
  } catch (err) { next(err); }
};

export const getWardSummary = async (req, res, next) => {
  try {
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [bedStats, flagStats, forecasts, dischargeStats] = await Promise.all([
      Bed.aggregate([
        {
          $group: {
            _id: '$wardId',
            total:     { $sum: 1 },
            occupied:  { $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] } },
            available: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } },
            cleaning:  { $sum: { $cond: [{ $eq: ['$status', 'cleaning'] }, 1, 0] } },
            reserved:  { $sum: { $cond: [{ $eq: ['$status', 'reserved'] }, 1, 0] } },
          },
        },
      ]),
      Bed.aggregate([
        { $match: { status: 'occupied', expectedDischargeDate: { $lt: new Date() } } },
        { $group: { _id: '$wardId', openFlags: { $sum: 1 } } },
      ]),
      WardForecast.find().lean(),
      Bed.aggregate([
        { $match: { status: 'occupied', patientId: { $ne: null } } },
        {
          $lookup: {
            from: 'patients',
            localField: 'patientId',
            foreignField: '_id',
            as: 'patient',
          },
        },
        { $unwind: '$patient' },
        {
          $match: {
            'patient.expectedDischarge': { $lte: endOfDay },
            'patient.dischargeCompletedAt': null,
          },
        },
        { $group: { _id: '$wardId', pendingDischarges: { $sum: 1 } } },
      ]),
    ]);

    const wards = await Ward.find().lean();

    const bedMap      = Object.fromEntries(bedStats.map((b) => [b._id, b]));
    const flagMap       = Object.fromEntries(flagStats.map((f) => [f._id, f.openFlags]));
    const forecastMap   = Object.fromEntries(forecasts.map((f) => [f.wardId, f]));
    const dischargeMap  = Object.fromEntries(dischargeStats.map((f) => [f._id, f.pendingDischarges]));

    const summary = wards.map((ward) => ({
      ...ward,
      beds:              bedMap[ward._id] ?? { total: 0, occupied: 0, available: 0, cleaning: 0, reserved: 0 },
      openFlags:         flagMap[ward._id] ?? 0,
      pendingDischarges: dischargeMap[ward._id] ?? 0,
      forecast:          forecastMap[ward._id] ?? null,
      occupancyPct: bedMap[ward._id]
        ? Math.round((bedMap[ward._id].occupied / bedMap[ward._id].total) * 100)
        : 0,
    }));

    res.json(summary);
  } catch (err) { next(err); }
};

export const getLatestHandoverSnapshot = async (req, res, next) => {
  try {
    assertSameWard(req, req.params.wardId);
    const shiftLabel = req.query.shiftLabel;
    const report = await getHandoverReport(req.params.wardId, shiftLabel);
    if (!report) {
      return res.status(404).json({ error: 'No handover snapshot available yet for this ward / shift' });
    }
    res.json(report);
  } catch (err) {
    next(err);
  }
};

export const getWardById = async (req, res, next) => {
  try {
    assertSameWard(req, req.params.wardId);
    if (req.params.wardId === 'global') {
      return res.json({ _id: 'global', name: 'Global Hospital Area' });
    }
    const ward = await Ward.findById(req.params.wardId).lean();
    if (!ward) return res.status(404).json({ error: 'Ward not found' });
    res.json(ward);
  } catch (err) { next(err); }
};

export const createWard = async (req, res) => {
  try {
    const capacity = Number(req.body.totalBeds);
    if (!Number.isInteger(capacity) || capacity < 1) {
      return res.status(400).json({ message: 'totalBeds must be an integer greater than zero' });
    }

    // 1. Create the Ward record
    const newWard = await Ward.create(req.body);

    // 2. Automatically generate the beds based on totalBeds capacity
    const bedDocs = Array.from({ length: capacity }, (_, index) => ({
      wardId: newWard._id,
      bedNumber: `${newWard.name.substring(0, 3).toUpperCase()}-${(index + 1).toString().padStart(2, '0')}`,
      status: 'available'
    }));

    try {
      await Bed.insertMany(bedDocs);
    } catch (error) {
      await Ward.findByIdAndDelete(newWard._id).catch(() => {});
      throw error;
    }

    res.status(201).json(newWard);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};