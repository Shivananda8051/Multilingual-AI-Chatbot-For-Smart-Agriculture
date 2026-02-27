const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const commodityPriceService = require('../services/commodityPriceService');

// All routes require authentication
router.use(protect);

// @desc    Get commodity prices
// @route   GET /api/commodity-prices
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { state, district, commodity, limit = 50, offset = 0 } = req.query;

    const result = await commodityPriceService.fetchCommodityPrices({
      state,
      district,
      commodity,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Get commodity prices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commodity prices',
      error: error.message
    });
  }
});

// @desc    Get available states
// @route   GET /api/commodity-prices/states
// @access  Private
router.get('/states', async (req, res) => {
  try {
    const result = await commodityPriceService.getAvailableStates();
    res.json(result);
  } catch (error) {
    console.error('Get states error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch states',
      error: error.message
    });
  }
});

// @desc    Get price comparison for a commodity
// @route   GET /api/commodity-prices/compare/:commodity
// @access  Private
router.get('/compare/:commodity', async (req, res) => {
  try {
    const { commodity } = req.params;
    const { state } = req.query;

    const result = await commodityPriceService.getCommodityPriceComparison(
      commodity,
      state
    );

    res.json(result);
  } catch (error) {
    console.error('Get price comparison error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch price comparison',
      error: error.message
    });
  }
});

module.exports = router;
