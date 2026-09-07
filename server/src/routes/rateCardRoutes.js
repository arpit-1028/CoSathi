const express = require('express');
const router = express.Router();
const { RateCardItem, RateCardVersion, ServiceCategory } = require('../models');
const { calculateInitialEstimate, getCurrentRateCardVersion } = require('../services/pricingService');

/**
 * GET /api/rate-card/items
 * Public / Authenticated: Returns all active cooperative rate card services & pricing
 */
router.get('/items', async (req, res, next) => {
  try {
    const { category } = req.query;
    const query = { $or: [{ active: true }, { isActive: true }] };

    if (category) {
      query.category = category;
    }

    const [items, version] = await Promise.all([
      RateCardItem.find(query).sort({ category: 1, name: 1 }),
      getCurrentRateCardVersion(),
    ]);

    res.status(200).json({
      success: true,
      count: items.length,
      rateCardVersion: version,
      items,
      uiMessage: 'AI identifies the work. The cooperative rate card determines the price.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/rate-card/estimate
 * Public / Customer: Calculate deterministic estimate range from tasks identified by Gemini
 */
router.post('/estimate', async (req, res, next) => {
  try {
    const { tasks = [] } = req.body;

    const estimateResult = await calculateInitialEstimate(tasks);

    res.status(200).json({
      success: true,
      data: estimateResult,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
