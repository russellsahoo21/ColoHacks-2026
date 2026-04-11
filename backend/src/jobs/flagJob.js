import cron from 'node-cron';
import {
  checkStaleDischarges,
  checkLongCleaning,
  checkCapacityCrunch,
  checkLosOutliers,
  autoResolveStaleFlags,
} from '../services/flagService.js';
const logger = console;

// Runs every 5 minutes — detects and raises escalation flags
export const startFlagJob = () => {
  cron.schedule('*/5 * * * *', async () => {
    logger.debug('flagJob: running');
    try {
      // Auto-resolve flags that are no longer applicable first
      await autoResolveStaleFlags();

      // Run all checks in parallel
      const [stale, cleaning, crunch, los] = await Promise.all([
        checkStaleDischarges(),
        checkLongCleaning(),
        checkCapacityCrunch(),
        checkLosOutliers(),
      ]);

      const newFlags = [...stale, ...cleaning, ...crunch, ...los].filter((r) => r?.isNew).length;
      if (newFlags > 0) {
        logger.info('flagJob: new flags raised', { count: newFlags });
      }
    } catch (err) {
      logger.error('flagJob error', { err: err.message });
    }
  });

  logger.info('flagJob scheduled: every 5 minutes');
};
