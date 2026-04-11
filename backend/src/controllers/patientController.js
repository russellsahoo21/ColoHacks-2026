import Patient from '../models/Patient.js';
import Bed from '../models/Bed.js';
import Admission from '../models/Admission.js';
import * as bedService from '../services/bedService.js';
import { assertDocInWard } from '../utils/accessControl.js';

const getPatientWard = async (patientId) => {
  const bed = await Bed.findOne({ patientId }).lean();
  if (bed?.wardId) return bed.wardId;

  const admission = await Admission.findOne({
    patientId,
    status: { $in: ['pending', 'arrived'] },
  }).lean();

  return admission?.wardId ?? null;
};

export const getPatientById = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id).lean();
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const wardId = await getPatientWard(patient._id);
    assertDocInWard(req, wardId);

    res.json(patient);
  } catch (err) { next(err); }
};

export const createPatient = async (req, res, next) => {
  try {
    const patient = await Patient.create(req.body);
    res.status(201).json(patient);
  } catch (err) { next(err); }
};

export const updatePatient = async (req, res, next) => {
  try {
    const existingPatient = await Patient.findById(req.params.id).lean();
    if (!existingPatient) return res.status(404).json({ error: 'Patient not found' });

    const wardId = await getPatientWard(existingPatient._id);
    assertDocInWard(req, wardId);

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).lean();
    res.json(patient);
  } catch (err) { next(err); }
};

export const dischargePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id).lean();
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const wardId = await getPatientWard(patient._id);
    assertDocInWard(req, wardId);

    const dischargeTime = req.body.dischargeCompletedAt ?? new Date();
    const updatedPatient = await Patient.findByIdAndUpdate(
      req.params.id,
      { $set: { dischargeCompletedAt: dischargeTime } },
      { new: true }
    ).lean();

    // Find the bed and free it for future admissions
    // Change Stream will broadcast this to all WS clients in the ward
    const bed = await Bed.findOneAndUpdate(
      { patientId: patient._id },
      { $set: { status: 'available', patientId: null, statusChangedAt: new Date() } },
      { new: true }
    ).lean();

    if (bed) {
      bedService.logEvent(
        'patient', patient._id, 'discharge_complete',
        req.user._id, bed.wardId,
        { bedId: bed._id, dischargeTime }
      ).catch(() => {});
    }

    res.json({ patient: updatedPatient, bed });
  } catch (err) { next(err); }
};

export const getPatientHistory = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id).lean();
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const wardId = await getPatientWard(patient._id);
    assertDocInWard(req, wardId);

    const { EventLog } = await import('../models/EventLog.js');
    const logs = await EventLog.find({ entityId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(logs);
  } catch (err) { next(err); }
};
