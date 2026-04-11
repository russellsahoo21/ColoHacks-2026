import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getForecast } from '../controllers/forecastController.js';

const router = Router();
router.use(authenticate);

// GET /api/forecast/:wardId
// Returns cached snapshot by default (fast), or live computation if ?live=true
router.get('/:wardId', getForecast);

export default router;
