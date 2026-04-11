import mongoose from 'mongoose';
import Bed from '../models/Bed.js';
import EventLog from '../models/EventLog.js';

const VALID_TRANSITIONS = {
  available: ['occupied', 'reserved', 'cleaning'],
  reserved:  ['occupied', 'available'],
  occupied:  ['cleaning', 'available'],
  cleaning:  ['available'],
};

export const validateTransition = async (bedId, newStatus) => {
  const bed = await Bed.findById(bedId).lean();
  if (!bed) throw Object.assign(new Error('Bed not found'), { status: 404 });
  if (bed.status !== newStatus && !VALID_TRANSITIONS[bed.status]?.includes(newStatus)) {
    throw Object.assign(
      new Error(`Cannot transition from '${bed.status}' to '${newStatus}'`),
      { status: 422 }
    );
  }
  return bed;
};

export const updateStatus = async (bedId, status, patientId, assignedDoctor, notes, expectedDischargeDate) => {
  const update = { status, statusChangedAt: new Date() };

  if (status === 'occupied') {
    if (patientId !== undefined) update.patientId = patientId;
    if (assignedDoctor !== undefined) update.assignedDoctor = assignedDoctor;
    if (expectedDischargeDate !== undefined) update.expectedDischargeDate = expectedDischargeDate;
  }
  if (status === 'available' || status === 'cleaning') {
    update.patientId = null;
    update.assignedDoctor = null;
    update.expectedDischargeDate = null;
  }
  if (notes !== undefined) update.notes = notes;

  return Bed.findByIdAndUpdate(bedId, { $set: update }, { new: true })
    .populate('patientId', 'name conditionCategory admissionDate responsibleDoctor')
    .lean();
};

export const getWardBeds = (wardId) => {
  const query = wardId === 'global' ? {} : { wardId };
  return Bed.find(query)
    .populate('patientId', 'name conditionCategory admissionDate responsibleDoctor expectedDischarge')
    .sort({ bedNumber: 1 })
    .lean();
};

export const getBedById = (bedId) =>
  Bed.findById(bedId)
    .populate('patientId')
    .lean();

export const createBed = (data) => Bed.create(data);

export const getOccupancy = async (wardId) => {
  const result = await Bed.aggregate([
    { $match: { wardId: new mongoose.Types.ObjectId(wardId) } },
    {
      $group: {
        _id: '$wardId',
        total:    { $sum: 1 },
        occupied: { $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] } },
        cleaning: { $sum: { $cond: [{ $eq: ['$status', 'cleaning'] }, 1, 0] } },
        reserved: { $sum: { $cond: [{ $eq: ['$status', 'reserved'] }, 1, 0] } },
        available:{ $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } },
      },
    },
  ]);
  return result[0] ?? { total: 0, occupied: 0, cleaning: 0, reserved: 0, available: 0 };
};

export const logEvent = (entityType, entityId, action, actorId, wardId, payload = {}) =>
  EventLog.create({ entityType, entityId, action, actorId, wardId, payload });
