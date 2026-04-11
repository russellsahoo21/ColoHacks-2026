import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { getAllWards, getWardSummary, getWardById, createWard, getLatestHandoverSnapshot } from '../controllers/wardController.js';

const router = Router();
router.use(authenticate);

// GET /api/wards — admin sees all, others see their own ward
router.get('/', getAllWards);

// GET /api/wards/summary — admin multi-ward overview
router.get('/summary', roleGuard('admin', 'ward_doctor', 'ward_staff'), getWardSummary);

// GET /api/wards/:wardId/handover — latest generated handover note for a shift
router.get('/:wardId/handover', getLatestHandoverSnapshot);

// GET /api/wards/:wardId — single ward detail
router.get('/:wardId', getWardById);

// POST /api/wards — create a ward (admin only)
router.post('/', roleGuard('admin'), createWard);

export default router;
