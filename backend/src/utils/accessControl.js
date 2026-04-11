import mongoose from 'mongoose';
import Admission from '../models/Admission.js';
import Bed from '../models/Bed.js';

const createAuthorizationError = (message = 'Not authorized to access this resource') => {
  const err = new Error(message);
  err.status = 403;
  return err;
};

export const assertSameWard = (req, wardId) => {
  // Global pool architecture - all staff can access all wards
  return;
};

export const assertDocInWard = (req, docWardId) => {
  // Global pool architecture - all staff can access all wards
  return;
};

export const getPatientWardId = async (patientId) => {
  const bed = await Bed.findOne({ patientId }).lean();
  if (bed?.wardId) return bed.wardId;

  const admission = await Admission.findOne({
    patientId,
    status: { $in: ['pending', 'arrived'] },
  }).lean();

  return admission?.wardId ?? null;
};
