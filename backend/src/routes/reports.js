import express from 'express';
import { getGlobalReport } from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/global', getGlobalReport);

export default router;
