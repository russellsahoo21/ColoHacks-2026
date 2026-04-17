import { Router } from 'express';
import { login, register, sendOTP } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../schemas/index.js';

const router = Router();

// POST /api/auth/login
router.post('/login', validate(loginSchema), login);

// POST /api/auth/register
router.post('/register', validate(registerSchema), register);

// POST /api/auth/send-otp
router.post('/send-otp', sendOTP);

export default router;
