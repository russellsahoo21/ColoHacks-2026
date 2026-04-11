import { computeForecast, getCachedForecast } from '../services/forecastService.js';
import { assertSameWard } from '../utils/accessControl.js';

export const getForecast = async (req, res, next) => {
  try {
    const { wardId } = req.params;
    assertSameWard(req, wardId);
    const live = req.query.live === 'true';

    let forecast;
    if (live) {
      forecast = await computeForecast(wardId);
    } else {
      forecast = await getCachedForecast(wardId);
      // If no cache yet (first boot), fall back to live
      if (!forecast) forecast = await computeForecast(wardId);
    }

    res.json(forecast);
  } catch (err) { next(err); }
};
