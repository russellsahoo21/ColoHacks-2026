import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { getQueue, createAdmission, arriveAdmission, cancelAdmission } from '../controllers/admissionController.js';

const router = Router();
router.use(authenticate);

// GET /api/admissions/:wardId/queue — pending + today's discharges
router.get('/:wardId/queue', getQueue);

// POST /api/admissions — register a new admission
router.post(
  '/',
  roleGuard('ward_staff', 'ward_doctor'),
  createAdmission
);

// PATCH /api/admissions/:id/arrive — patient has arrived, assign to a bed
router.patch(
  '/:id/arrive',
  roleGuard('ward_staff', 'ward_doctor'),
  arriveAdmission
);

// PATCH /api/admissions/:id/cancel
router.patch(
  '/:id/cancel',
  roleGuard('ward_staff', 'ward_doctor'),
  cancelAdmission
);

export default router;
