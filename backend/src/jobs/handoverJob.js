import cron from 'node-cron';
import mongoose from 'mongoose';
import Ward from '../models/Ward.js';
import Bed from '../models/Bed.js';
import Patient from '../models/Patient.js';
import Admission from '../models/Admission.js';
import EscalationFlag from '../models/EscalationFlag.js';
import EventLog from '../models/EventLog.js';
const logger = console;

// Handover snapshot schema — stored in a dedicated collection
const handoverSchema = new mongoose.Schema({
  wardId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Ward', required: true },
  wardName:     String,
  shiftLabel:   String,        // 'morning' | 'afternoon' | 'night'
  generatedAt:  { type: Date, default: Date.now },
  bedSummary: {
    total:     Number,
    occupied:  Number,
    available: Number,
    cleaning:  Number,
    reserved:  Number,
  },
  occupiedBeds: [mongoose.Schema.Types.Mixed],   // snapshot of each occupied bed
  pendingAdmissions: [mongoose.Schema.Types.Mixed],
  pendingDischarges: [mongoose.Schema.Types.Mixed],
  openFlags: [mongoose.Schema.Types.Mixed],
  flaggedPatients: [mongoose.Schema.Types.Mixed], // patients needing attention
});

const HandoverSnapshot = mongoose.models.HandoverSnapshot
  ?? mongoose.model('HandoverSnapshot', handoverSchema);

const SHIFT_BOUNDARIES = [
  { label: 'morning',   cron: `0 ${process.env.SHIFT_MORNING_END?.split(':')?.[1] ?? 0} ${process.env.SHIFT_MORNING_END?.split(':')?.[0] ?? 8} * * *` },
  { label: 'afternoon', cron: `0 ${process.env.SHIFT_AFTERNOON_END?.split(':')?.[1] ?? 0} ${process.env.SHIFT_AFTERNOON_END?.split(':')?.[0] ?? 16} * * *` },
  { label: 'night',     cron: `0 ${process.env.SHIFT_NIGHT_END?.split(':')?.[1] ?? 0} ${process.env.SHIFT_NIGHT_END?.split(':')?.[0] ?? 0} * * *` },
];

const generateHandoverForWard = async (ward, shiftLabel) => {
  const wardId = ward._id;
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [beds, flags, pendingAdmissions] = await Promise.all([
    Bed.find({ wardId })
      .populate('patientId', 'name conditionCategory admissionDate responsibleDoctor expectedDischarge losThresholdDays')
      .lean(),
    EscalationFlag.find({ wardId, resolvedAt: null })
      .populate('bedId', 'bedNumber')
      .populate('patientId', 'name')
      .lean(),
    Admission.find({ wardId, status: 'pending' })
      .populate('patientId', 'name conditionCategory')
      .lean(),
  ]);

  const occupiedBeds = beds.filter((b) => b.status === 'occupied');

  // Patients expected to discharge today
  const pendingDischarges = occupiedBeds
    .filter((b) => b.patientId?.expectedDischarge && new Date(b.patientId.expectedDischarge) <= endOfDay)
    .map((b) => ({ bed: b.bedNumber, patient: b.patientId }));

  // Patients flagged for clinical attention (LOS outliers + stale discharges)
  const flaggedPatientIds = new Set(flags.map((f) => f.patientId?.toString()).filter(Boolean));
  const flaggedPatients = occupiedBeds
    .filter((b) => b.patientId && flaggedPatientIds.has(b.patientId._id.toString()))
    .map((b) => ({ bed: b.bedNumber, patient: b.patientId }));

  const bedSummary = {
    total:     beds.length,
    occupied:  beds.filter((b) => b.status === 'occupied').length,
    available: beds.filter((b) => b.status === 'available').length,
    cleaning:  beds.filter((b) => b.status === 'cleaning').length,
    reserved:  beds.filter((b) => b.status === 'reserved').length,
  };

  await HandoverSnapshot.create({
    wardId,
    wardName: ward.name,
    shiftLabel,
    bedSummary,
    occupiedBeds: occupiedBeds.map((b) => ({
      bedNumber: b.bedNumber,
      patient: b.patientId,
      assignedDoctor: b.assignedDoctor,
      notes: b.notes,
    })),
    pendingAdmissions: pendingAdmissions.map((a) => ({
      type: a.type,
      patient: a.patientId,
      expectedArrival: a.expectedArrival,
    })),
    pendingDischarges,
    openFlags: flags.map((f) => ({ type: f.type, message: f.message, triggeredAt: f.triggeredAt })),
    flaggedPatients,
  });

  logger.info('handoverJob: snapshot created', { ward: ward.name, shift: shiftLabel });
};

export const startHandoverJob = () => {
  SHIFT_BOUNDARIES.forEach(({ label, cron: cronExpr }) => {
    cron.schedule(cronExpr, async () => {
      logger.debug(`handoverJob: generating ${label} shift handover`);
      try {
        const wards = await Ward.find({ isActive: true }).lean();
        await Promise.all(wards.map((ward) => generateHandoverForWard(ward, label)));
      } catch (err) {
        logger.error('handoverJob error', { err: err.message, shift: label });
      }
    });
    logger.info(`handoverJob scheduled: ${label} shift at ${cronExpr}`);
  });
};

// GET endpoint helper — latest handover for a ward
export const getLatestHandover = (wardId, shiftLabel) => {
  const filter = { wardId };
  if (shiftLabel) filter.shiftLabel = shiftLabel;
  return HandoverSnapshot.findOne(filter).sort({ generatedAt: -1 }).lean();
};

export const getHandoverReport = async (wardId, shiftLabel) => {
  const snapshot = await getLatestHandover(wardId, shiftLabel);
  if (!snapshot) return null;

  const windowEnd = snapshot.generatedAt ? new Date(snapshot.generatedAt) : new Date();
  const windowStart = new Date(windowEnd.getTime() - 8 * 60 * 60 * 1000);

  const eventCounts = await EventLog.aggregate([
    {
      $match: {
        wardId: new mongoose.Types.ObjectId(wardId),
        createdAt: { $gte: windowStart, $lte: windowEnd },
      },
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
      },
    },
  ]);

  const actionMap = Object.fromEntries(eventCounts.map((item) => [item._id, item.count]));

  const bedTransitions = await EventLog.aggregate([
    {
      $match: {
        wardId: new mongoose.Types.ObjectId(wardId),
        action: 'status_update',
        createdAt: { $gte: windowStart, $lte: windowEnd },
      },
    },
    {
      $group: {
        _id: '$payload.to',
        count: { $sum: 1 },
      },
    },
  ]);

  const transitionMap = Object.fromEntries(bedTransitions.map((item) => [item._id, item.count]));

  const escalationsRaised = await EscalationFlag.countDocuments({
    wardId,
    triggeredAt: { $gte: windowStart, $lte: windowEnd },
  });

  const escalationsResolved = await EscalationFlag.countDocuments({
    wardId,
    resolvedAt: { $gte: windowStart, $lte: windowEnd },
  });

  const reportSummary = {
    shiftLabel: snapshot.shiftLabel,
    windowStart,
    windowEnd,
    shiftHours: 8,
    admissionsProcessed: actionMap.patient_arrived ?? 0,
    dischargesCompleted: actionMap.discharge_complete ?? 0,
    escalationResolutions: actionMap.flag_resolved ?? 0,
    escalationsRaised,
    bedTransitions: {
      occupied: transitionMap.occupied ?? 0,
      available: transitionMap.available ?? 0,
      cleaning: transitionMap.cleaning ?? 0,
      reserved: transitionMap.reserved ?? 0,
      total: Object.values(transitionMap).reduce((sum, value) => sum + value, 0),
    },
    summaryText: `Shift ending ${windowEnd.toISOString()} included ${actionMap.patient_arrived ?? 0} admissions, ${actionMap.discharge_complete ?? 0} discharges, ${escalationsRaised} escalations raised, ${actionMap.flag_resolved ?? 0} flag resolutions, and ${Object.values(transitionMap).reduce((sum, value) => sum + value, 0)} bed status changes.`,
  };

  return {
    ...snapshot,
    reportSummary,
  };
};
