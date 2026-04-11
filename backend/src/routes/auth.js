import { Router } from 'express';
import { login, register, sendOTP } from '../controllers/authController.js';

const router = Router();

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/send-otp
router.post('/send-otp', sendOTP);

export default router;
