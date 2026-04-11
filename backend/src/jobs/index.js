import { startForecastJob } from './forecastJob.js';
import { startFlagJob } from './flagJob.js';
import { startHandoverJob } from './handoverJob.js';

export const startJobs = () => {
  startForecastJob();
  startFlagJob();
  startHandoverJob();
};
