import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { getWardBeds, getSingleBed, createBed, updateBedStatus } from '../controllers/bedController.js';

const router = Router();
router.use(authenticate);

// GET /api/beds/:wardId — full bed board for a ward
router.get('/:wardId', getWardBeds);

// GET /api/beds/single/:bedId — single bed detail
router.get('/single/:bedId', getSingleBed);

// POST /api/beds — create a new bed (admin only)
router.post(
  '/',
  roleGuard('admin'),
  createBed
);

// PATCH /api/beds/:bedId/status — update bed status
router.patch(
  '/:bedId/status',
  roleGuard('ward_staff', 'ward_doctor'),
  updateBedStatus
);

export default router;
