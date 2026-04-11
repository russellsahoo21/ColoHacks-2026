import mongoose from 'mongoose';
import Ward from '../models/Ward.js';
import EventLog from '../models/EventLog.js';
import EscalationFlag from '../models/EscalationFlag.js';
import Patient from '../models/Patient.js';
import Admission from '../models/Admission.js';
import Bed from '../models/Bed.js';

export const getGlobalReport = async (req, res, next) => {
  try {
    const shiftLabel = req.query.shiftLabel;
    
    // 1. Get all active wards
    const wards = await Ward.find({ isActive: true }).lean();
    
    // Ensure the model is loaded from handoverJob.js or use mongoose.model
    // We import handoverJob to ensure it's evaluated
    await import('../jobs/handoverJob.js');
    const HandoverSnapshot = mongoose.models.HandoverSnapshot;

    // 2. Fetch latest snapshot for each ward matching shiftLabel
    const snapshotPromises = wards.map(async (ward) => {
      const filter = { wardId: ward._id };
      if (shiftLabel) filter.shiftLabel = shiftLabel;
      const snapshot = await HandoverSnapshot.findOne(filter)
        .sort({ generatedAt: -1 })
        .lean();
      return snapshot;
    });

    const snapshots = (await Promise.all(snapshotPromises)).filter(Boolean);

    // 3. Aggregate global snapshot data
    const globalSnapshot = {
      shiftLabel: shiftLabel || 'latest',
      generatedAt: new Date(),
      bedSummary: { total: 0, occupied: 0, available: 0, cleaning: 0, reserved: 0 },
      occupiedBedsCount: 0,
      pendingAdmissions: [],
      pendingDischarges: [],
      openFlags: [],
      flaggedPatientsCount: 0,
    };

    let oldestWindowStart = new Date();
    let newestWindowEnd = new Date(0);

    for (const snap of snapshots) {
      if (snap.bedSummary) {
        globalSnapshot.bedSummary.total += snap.bedSummary.total || 0;
        globalSnapshot.bedSummary.occupied += snap.bedSummary.occupied || 0;
        globalSnapshot.bedSummary.available += snap.bedSummary.available || 0;
        globalSnapshot.bedSummary.cleaning += snap.bedSummary.cleaning || 0;
        globalSnapshot.bedSummary.reserved += snap.bedSummary.reserved || 0;
      }
      
      if (snap.occupiedBeds) globalSnapshot.occupiedBedsCount += snap.occupiedBeds.length;
      if (snap.flaggedPatients) globalSnapshot.flaggedPatientsCount += snap.flaggedPatients.length;
      
      if (snap.pendingAdmissions) {
        globalSnapshot.pendingAdmissions.push(...snap.pendingAdmissions.map(a => ({ ...a, wardName: snap.wardName })));
      }
      if (snap.pendingDischarges) {
        globalSnapshot.pendingDischarges.push(...snap.pendingDischarges.map(d => ({ ...d, wardName: snap.wardName })));
      }
      if (snap.openFlags) {
        globalSnapshot.openFlags.push(...snap.openFlags.map(f => ({ ...f, wardName: snap.wardName })));
      }

      const snapTime = snap.generatedAt ? new Date(snap.generatedAt) : new Date();
      if (snapTime < oldestWindowStart) oldestWindowStart = snapTime;
      if (snapTime > newestWindowEnd) newestWindowEnd = snapTime;
    }

    // 4. Time Window for Event Logs & Live Updates
    let windowStart;
    let windowEnd;
    
    const now = new Date();
    // Midnight of the current day
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    if (shiftLabel === 'morning') {
      // First 8 hours info
      windowStart = new Date(todayMidnight.getTime()); // 00:00
      windowEnd = new Date(todayMidnight.getTime() + 8 * 60 * 60 * 1000); // 08:00
    } else if (shiftLabel === 'afternoon') {
      // Next 8 hours info
      windowStart = new Date(todayMidnight.getTime() + 8 * 60 * 60 * 1000); // 08:00
      windowEnd = new Date(todayMidnight.getTime() + 16 * 60 * 60 * 1000); // 16:00
    } else if (shiftLabel === 'evening' || shiftLabel === 'night') {
      // Next 8 hours info
      windowStart = new Date(todayMidnight.getTime() + 16 * 60 * 60 * 1000); // 16:00
      windowEnd = new Date(todayMidnight.getTime() + 24 * 60 * 60 * 1000); // 24:00
    } else {
      // For 'latest' (or unspecified) shift, use the real-time rolling 8 hours
      windowEnd = new Date();
      windowStart = new Date(windowEnd.getTime() - 8 * 60 * 60 * 1000);
    }
    
    // Always fetch LIVE bed stats for the Global Bed Status summary, overriding any stale or ungenerated snapshots
    const liveStats = await Bed.aggregate([
      {
        $group: {
          _id: null,
          total:     { $sum: 1 },
          occupied:  { $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] } },
          available: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } },
          cleaning:  { $sum: { $cond: [{ $eq: ['$status', 'cleaning'] }, 1, 0] } },
          reserved:  { $sum: { $cond: [{ $eq: ['$status', 'reserved'] }, 1, 0] } },
        },
      },
    ]);
    if (liveStats.length > 0) {
      globalSnapshot.bedSummary = {
        total: liveStats[0].total,
        occupied: liveStats[0].occupied,
        available: liveStats[0].available,
        cleaning: liveStats[0].cleaning,
        reserved: liveStats[0].reserved,
      };
    }

    // 5. Aggregate EventLogs globally
    const eventCounts = await EventLog.aggregate([
      {
        $match: {
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
      triggeredAt: { $gte: windowStart, $lte: windowEnd },
    });
    const escalationsResolved = await EscalationFlag.countDocuments({
      resolvedAt: { $gte: windowStart, $lte: windowEnd },
    });

    // Extract actual fulfilled events to display the list of patients
    const [admissionsEvents, dischargeEvents, transferEvents] = await Promise.all([
      EventLog.find({ action: 'patient_arrived', createdAt: { $gte: windowStart, $lte: windowEnd } })
        .populate({ path: 'entityId', model: 'Admission', populate: { path: 'patientId', select: 'name' } })
        .populate('wardId', 'name')
        .lean(),
      EventLog.find({ action: 'discharge_complete', createdAt: { $gte: windowStart, $lte: windowEnd } })
        .populate({ path: 'entityId', model: 'Patient', select: 'name' })
        .populate('wardId', 'name')
        .lean(),
      EventLog.find({ action: 'status_update', 'payload.to': 'occupied', createdAt: { $gte: windowStart, $lte: windowEnd } })
        .populate({ path: 'entityId', model: 'Bed', populate: { path: 'patientId', select: 'name' } })
        .populate('wardId', 'name')
        .lean()
    ]);

    const completedAdmissions = admissionsEvents.map(e => ({
      patientName: e.entityId?.patientId?.name || 'Unknown Patient',
      wardName: e.wardId?.name || 'Unknown Ward',
      time: e.createdAt,
      bedId: e.payload?.bedId
    }));

    const completedDischarges = dischargeEvents.map(e => ({
      patientName: e.entityId?.name || 'Unknown Patient',
      wardName: e.wardId?.name || 'Unknown Ward',
      time: e.createdAt,
      bedId: e.payload?.bedId
    }));

    // For transfers, we'll just consider any bed that became occupied as a proxy, 
    // since specific transfer actions aren't explicitly modelled 
    const recentTransfers = transferEvents.map(e => ({
      patientName: e.entityId?.patientId?.name || 'Unknown Patient',
      wardName: e.wardId?.name || 'Unknown Ward',
      time: e.createdAt,
      bedNumber: e.entityId?.bedNumber
    }));

    const reportSummary = {
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
      summaryText: `Hospital shift ending ${windowEnd.toLocaleString()} included ${actionMap.patient_arrived ?? 0} admissions, ${actionMap.discharge_complete ?? 0} discharges, ${escalationsRaised} escalations raised, and ${Object.values(transitionMap).reduce((sum, value) => sum + value, 0)} bed status changes globally.`,
    };

    res.json({
      ...globalSnapshot,
      reportSummary,
      completedAdmissions,
      completedDischarges,
      recentTransfers,
      wardsIncluded: wards.length,
      snapshotsFound: snapshots.length
    });
  } catch (err) {
    next(err);
  }
};
