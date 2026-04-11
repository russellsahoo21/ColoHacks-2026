import Admission from '../models/Admission.js';
import Patient from '../models/Patient.js';
import Bed from '../models/Bed.js';

// All pending/upcoming admissions for a ward
export const getPendingAdmissions = (wardId) => {
  const query = { status: 'pending' };
  if (wardId && wardId !== 'global') query.wardId = wardId;
  return Admission.find(query)
    .populate('patientId', 'name conditionCategory age gender')
    .sort({ expectedArrival: 1 })
    .lean();
};

// Patients expected to discharge today and not yet done
export const getPendingDischarges = async (wardId) => {
  const now = new Date();

  // Find beds that are occupied and their expected discharge time has passed
  const query = { status: 'occupied', expectedDischargeDate: { $lte: now } };
  if (wardId && wardId !== 'global') query.wardId = wardId;

  const beds = await Bed.find(query)
    .populate('patientId')
    .lean();

  return beds.map((bed) => ({
    _id: bed._id,
    bed,
    patient: bed.patientId,
    patientId: bed.patientId?._id,
    expectedDischarge: bed.expectedDischargeDate,
    type: 'Overdue Discharge',
    status: 'pending',
    notes: bed.notes
  }));
};

export const countAdmissionsBefore = (wardId, before) =>
  Admission.countDocuments({
    wardId,
    status: 'pending',
    expectedArrival: { $lte: before },
  });

export const markArrived = async (admissionId, bedId) => {
  const admission = await Admission.findByIdAndUpdate(
    admissionId,
    { $set: { arrivedAt: new Date(), status: 'arrived', bedId } },
    { new: true }
  ).lean();

  if (!admission) throw Object.assign(new Error('Admission not found'), { status: 404 });

  await Bed.findByIdAndUpdate(bedId, {
    $set: {
      status: 'occupied',
      patientId: admission.patientId,
      statusChangedAt: new Date(),
    },
  });

  return admission;
};

export const cancelAdmission = (admissionId) =>
  Admission.findByIdAndUpdate(admissionId, { $set: { status: 'cancelled' } }, { new: true }).lean();
