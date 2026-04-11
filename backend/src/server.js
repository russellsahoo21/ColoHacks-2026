import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import redis from './config/redis.js';
import { wsHub } from './services/wsHub.js';
import { startChangeStreams } from './streams/changeStreamWatcher.js';
import { startJobs } from './jobs/index.js';
const logger = console;

const PORT = process.env.PORT ?? 5000;

const server = http.createServer(app);

const start = async () => {
  try {
    // 1. Connect to MongoDB (replica set required for Change Streams)
    await connectDB();

    // 2. Attach WebSocket server to the same HTTP server
    wsHub.init(server);

    // 3. Start MongoDB Change Stream watchers → push updates to WS clients
    startChangeStreams();

    // 4. Start background cron jobs
    startJobs();

    // 5. Listen
    server.listen(PORT, () => {
      logger.info(`WardWatch API running`, {
        port: PORT,
        env: process.env.NODE_ENV ?? 'development',
      });
    });
  } catch (err) {
    logger.error('Failed to start server', { err: err.message });
    process.exit(1);
  }
};

// ─── Graceful shutdown ────────────────────────────────────────────────────────
const shutdown = async (signal) => {
  logger.info(`${signal} received — shutting down`);
  server.close(async () => {
    const mongoose = (await import('mongoose')).default;
    await mongoose.disconnect();
    logger.info('MongoDB disconnected. Bye.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason });
});

start();
