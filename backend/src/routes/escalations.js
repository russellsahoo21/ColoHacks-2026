import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { getOpenFlags, raiseFlag, resolveFlag } from '../controllers/escalationController.js';

const router = Router();
router.use(authenticate);

// GET /api/escalations/:wardId — open flags for a ward
router.get('/:wardId', getOpenFlags);

// POST /api/escalations/:wardId — raise a new escalation flag manually
router.post('/:wardId', roleGuard('ward_staff', 'ward_doctor'), raiseFlag);

// PATCH /api/escalations/:flagId/resolve — manually resolve a flag
router.patch(
  '/:flagId/resolve',
  roleGuard('ward_staff', 'ward_doctor'),
  resolveFlag
);

export default router;
