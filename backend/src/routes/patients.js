import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { getPatientById, createPatient, updatePatient, dischargePatient, getPatientHistory } from '../controllers/patientController.js';

const router = Router();
router.use(authenticate);

// GET /api/patients/:id
router.get('/:id', getPatientById);

// POST /api/patients — admit a new patient
router.post(
  '/',
  roleGuard('ward_staff', 'ward_doctor'),
  createPatient
);

// PATCH /api/patients/:id — update patient details
router.patch(
  '/:id',
  roleGuard('ward_staff', 'ward_doctor'),
  updatePatient
);

// PATCH /api/patients/:id/discharge — mark discharge complete
router.patch(
  '/:id/discharge',
  roleGuard('ward_staff', 'ward_doctor'),
  dischargePatient
);

// GET /api/patients/:id/history — event log for a patient
router.get('/:id/history', getPatientHistory);

export default router;
