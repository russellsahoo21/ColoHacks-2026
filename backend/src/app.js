import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import wardsRouter from './routes/wards.js';
import bedsRouter from './routes/beds.js';
import patientsRouter from './routes/patients.js';
import admissionsRouter from './routes/admissions.js';
import forecastRouter from './routes/forecast.js';
import escalationsRouter from './routes/escalations.js';
import authRouter from './routes/auth.js';
import reportsRouter from './routes/reports.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// ─── Security ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN ?? '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
}));

// ─── Rate limiting ────────────────────────────────────────────────────────────
// Generous limit for read-heavy dashboard; tighter for writes
const readLimiter = rateLimit({ windowMs: 60_000, max: 300, standardHeaders: true });
const writeLimiter = rateLimit({ windowMs: 60_000, max: 60, standardHeaders: true });

app.use('/api', readLimiter);
app.use('/api/beds', writeLimiter);
app.use('/api/admissions', writeLimiter);
app.use('/api/patients', writeLimiter);

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '100kb' }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',        authRouter);
app.use('/api/wards',       wardsRouter);
app.use('/api/beds',        bedsRouter);
app.use('/api/patients',    patientsRouter);
app.use('/api/admissions',  admissionsRouter);
app.use('/api/forecast',    forecastRouter);
app.use('/api/escalations', escalationsRouter);
app.use('/api/reports',     reportsRouter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date() });
});

// 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Centralised error handler
app.use(errorHandler);

export default app;
