const {
  computeStatisticalForecast,
  seedHistoricalBookingsIfSparse,
} = require('../services/forecastService');

/**
 * GET /api/cooperative/forecast
 * Returns 7-day demand predictions, trade growth trends, capacity gaps, and briefing
 */
const getForecastData = async (req, res, next) => {
  try {
    const cooperativeId = req.user?.cooperative || null;
    const forecastResult = await computeStatisticalForecast(cooperativeId);
    res.status(200).json({
      success: true,
      ...forecastResult,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/cooperative/forecast/recalculate
 * Triggers re-computation of statistical model across latest bookings
 */
const recalculateForecast = async (req, res, next) => {
  try {
    const cooperativeId = req.user?.cooperative || null;
    const forecastResult = await computeStatisticalForecast(cooperativeId);
    res.status(200).json({
      success: true,
      message: 'Demand forecast and workforce allocation successfully recalculated from historical bookings.',
      ...forecastResult,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/cooperative/forecast/seed-history
 * Ensures 30-day realistic historical data is populated for the cooperative
 */
const seedForecastHistory = async (req, res, next) => {
  try {
    const cooperativeId = req.user?.cooperative || null;
    const result = await seedHistoricalBookingsIfSparse(cooperativeId);
    res.status(200).json({
      success: true,
      message: result.seeded
        ? `Seeded ${result.count} historical bookings across 30 days.`
        : `Database already has ${result.count} bookings; no seeding required.`,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getForecastData,
  recalculateForecast,
  seedForecastHistory,
};
