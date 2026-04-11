import mongoose from 'mongoose';
import Bed from '../models/Bed.js';
import Patient from '../models/Patient.js';
import Admission from '../models/Admission.js';
import WardForecast from '../models/WardForecast.js';

const hoursFromNow = (h) => new Date(Date.now() + h * 3_600_000);

export const computeForecast = async (wardId) => {
  const oid = new mongoose.Types.ObjectId(wardId);

  const [occupancy, d4h, d8h, a4h, a8h] = await Promise.all([
    // Current occupancy breakdown
    Bed.aggregate([
      { $match: { wardId: oid } },
      {
        $group: {
          _id: null,
          total:     { $sum: 1 },
          occupied:  { $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] } },
          cleaning:  { $sum: { $cond: [{ $eq: ['$status', 'cleaning'] }, 1, 0] } },
          reserved:  { $sum: { $cond: [{ $eq: ['$status', 'reserved'] }, 1, 0] } },
          available: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } },
        },
      },
    ]),

    // Patients in this ward expected to discharge within 4h, not yet done
    _countPendingDischargesInWard(oid, hoursFromNow(4)),
    _countPendingDischargesInWard(oid, hoursFromNow(8)),

    // Pending admissions expected within 4h
    Admission.countDocuments({
      wardId,
      status: 'pending',
      expectedArrival: { $lte: hoursFromNow(4) },
    }),
    Admission.countDocuments({
      wardId,
      status: 'pending',
      expectedArrival: { $lte: hoursFromNow(8) },
    }),
  ]);

  const base = occupancy[0] ?? { total: 0, occupied: 0, cleaning: 0, reserved: 0, available: 0 };

  const clamp = (n, max) => Math.min(Math.max(0, n), max);

  return {
    now:  { ...base },
    at4h: {
      occupied: clamp(base.occupied - d4h + a4h, base.total),
      total: base.total,
    },
    at8h: {
      occupied: clamp(base.occupied - d8h + a8h, base.total),
      total: base.total,
    },
    computedAt: new Date(),
  };
};

// Count patients with a bed in this ward whose expectedDischarge is before `before`
const _countPendingDischargesInWard = async (wardId, before) => {
  const beds = await Bed.find({ wardId, status: 'occupied', patientId: { $ne: null } })
    .select('patientId')
    .lean();

  const patientIds = beds.map((b) => b.patientId);

  return Patient.countDocuments({
    _id: { $in: patientIds },
    expectedDischarge: { $lte: before },
    dischargeCompletedAt: null,
  });
};

// Persist snapshot — called by forecastJob every 15 min
export const saveForecastSnapshot = async (wardId, forecast) =>
  WardForecast.findOneAndUpdate(
    { wardId },
    { $set: { ...forecast, updatedAt: new Date() } },
    { upsert: true, new: true }
  );

// Read cached forecast (used by /forecast route for fast response)
export const getCachedForecast = (wardId) =>
  WardForecast.findOne({ wardId }).lean();
