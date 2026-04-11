import mongoose from 'mongoose';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail } from '../utils/sendEmail.js';

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required to send OTP.' });

    const normalizedEmail = email.trim().toLowerCase();

    // Ensure user doesn't already exist
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const otpCode = generateOTP();

    // Save or update existing OTP for this email
    await OTP.findOneAndUpdate(
      { email: normalizedEmail },
      { otp: otpCode, createdAt: Date.now() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Send the email
    try {
      await sendVerificationEmail(normalizedEmail, otpCode);
      console.log(`[EMAIL SENT] OTP for ${normalizedEmail} is an actual email delivery.`);
    } catch (emailErr) {
      console.error('🛑 EMAIL SENDING FAILED (Likely dummy EMAIL_PASS in .env):', emailErr.message);
      console.log('\n===========================================');
      console.log('⚠️ DEVELOPMENT BYPASS: Email failed to send.');
      console.log(`👉 Your requested OTP Code is: ${otpCode}`);
      console.log('===========================================\n');
      // We purposefully DO NOT return a 500 error here so you can continue testing the UI.
    }

    res.status(200).json({ message: 'Verification code generated' });
  } catch (err) { next(err); }
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, otp } = req.body;

    if (!name || !email || !password || !role || !otp) {
      return res.status(422).json({ error: 'Missing required registration fields including OTP.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Verify OTP
    const otpRecord = await OTP.findOne({ email: normalizedEmail });
    if (!otpRecord) {
      return res.status(400).json({ error: 'OTP expired or not found. Please request a new one.' });
    }

    if (otpRecord.otp !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    // OTP is valid. Check if user was registered meanwhile.
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Create User (all users created this way are inherently verified)
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
      isVerified: true
    });

    // Clean up OTP record
    await OTP.deleteOne({ email: normalizedEmail });
    
    // Auto-login after registration
    const token = jwt.sign(
      { _id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN ?? '8h' }
    );

    res.status(201).json({ 
      message: 'Registration successful!', 
      token, 
      user: { _id: user._id, name: user.name, role: user.role } 
    });
  } catch (err) { next(err); }
};

export const login = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email, isActive: true }).select('+password +isVerified');
    if (!user || !(await user.comparePassword(req.body.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.isVerified === false) {
      return res.status(403).json({ error: 'Please verify your email address to login.', notVerified: true });
    }

    const token = jwt.sign(
      { _id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN ?? '8h' }
    );

    res.json({ token, user: { _id: user._id, name: user.name, role: user.role } });
  } catch (err) { next(err); }
};
