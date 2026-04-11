import cron from 'node-cron';
import Ward from '../models/Ward.js';
import { computeForecast, saveForecastSnapshot } from '../services/forecastService.js';
const logger = console;

// Runs every 15 minutes — refreshes the WardForecast snapshot for every active ward
export const startForecastJob = () => {
  cron.schedule('*/15 * * * *', async () => {
    logger.debug('forecastJob: running');
    try {
      const wards = await Ward.find({ isActive: true }).lean();

      await Promise.all(
        wards.map(async (ward) => {
          const forecast = await computeForecast(ward._id.toString());
          await saveForecastSnapshot(ward._id, forecast);
          logger.debug('forecastJob: updated snapshot', {
            ward: ward.name,
            occupied: forecast.now.occupied,
            total: forecast.now.total,
          });
        })
      );
    } catch (err) {
      logger.error('forecastJob error', { err: err.message });
    }
  });

  logger.info('forecastJob scheduled: every 15 minutes');
};
