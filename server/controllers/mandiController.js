/**
 * Mandi Price Controller
 * Handles API requests for agricultural commodity market prices
 * Data Source: data.gov.in - Government Open Data Platform
 */

const mandiPriceService = require('../services/mandiPriceService');

// @desc    Get mandi prices with filters
// @route   GET /api/mandi/prices
// @access  Public
exports.getPrices = async (req, res) => {
  try {
    const { state, district, market, commodity, variety, grade, limit, offset } = req.query;

    const result = await mandiPriceService.getMandiPrices({
      state,
      district,
      market,
      commodity,
      variety,
      grade,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    });

    res.json({
      success: true,
      message: 'Mandi prices fetched successfully',
      source: 'data.gov.in',
      ...result
    });
  } catch (error) {
    console.error('Get mandi prices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mandi prices',
      error: error.message
    });
  }
};

// @desc    Get prices for a specific commodity
// @route   GET /api/mandi/commodity/:name
// @access  Public
exports.getCommodityPrices = async (req, res) => {
  try {
    const { name } = req.params;
    const { state } = req.query;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Commodity name is required'
      });
    }

    const result = await mandiPriceService.getCommodityPrices(name, state);

    res.json({
      success: true,
      commodity: name,
      source: 'data.gov.in',
      ...result
    });
  } catch (error) {
    console.error('Get commodity prices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commodity prices',
      error: error.message
    });
  }
};

// @desc    Get price comparison for a commodity across markets
// @route   GET /api/mandi/compare/:commodity
// @access  Public
exports.getPriceComparison = async (req, res) => {
  try {
    const { commodity } = req.params;
    const { state } = req.query;

    if (!commodity) {
      return res.status(400).json({
        success: false,
        message: 'Commodity name is required'
      });
    }

    const result = await mandiPriceService.getPriceComparison(commodity, state);

    res.json({
      success: true,
      source: 'data.gov.in',
      ...result
    });
  } catch (error) {
    console.error('Get price comparison error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch price comparison',
      error: error.message
    });
  }
};

// @desc    Get prices by state
// @route   GET /api/mandi/state/:state
// @access  Public
exports.getStatePrices = async (req, res) => {
  try {
    const { state } = req.params;
    const { limit } = req.query;

    if (!state) {
      return res.status(400).json({
        success: false,
        message: 'State name is required'
      });
    }

    const result = await mandiPriceService.getStatePrices(state, parseInt(limit) || 100);

    res.json({
      success: true,
      state,
      source: 'data.gov.in',
      ...result
    });
  } catch (error) {
    console.error('Get state prices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch state prices',
      error: error.message
    });
  }
};

// @desc    Get available states
// @route   GET /api/mandi/states
// @access  Public
exports.getStates = async (req, res) => {
  try {
    const result = await mandiPriceService.getAvailableStates();

    res.json({
      success: true,
      source: 'data.gov.in',
      ...result
    });
  } catch (error) {
    console.error('Get states error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch states',
      error: error.message
    });
  }
};

// @desc    Get trending commodities
// @route   GET /api/mandi/trending
// @access  Public
exports.getTrending = async (req, res) => {
  try {
    const { state } = req.query;

    const result = await mandiPriceService.getTrendingCommodities(state);

    res.json({
      success: true,
      source: 'data.gov.in',
      ...result
    });
  } catch (error) {
    console.error('Get trending error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending commodities',
      error: error.message
    });
  }
};

// @desc    Get prices from a specific market
// @route   GET /api/mandi/market/:name
// @access  Public
exports.getMarketPrices = async (req, res) => {
  try {
    const { name } = req.params;
    const { state } = req.query;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Market name is required'
      });
    }

    const result = await mandiPriceService.getMarketPrices(name, state);

    res.json({
      success: true,
      market: name,
      source: 'data.gov.in',
      ...result
    });
  } catch (error) {
    console.error('Get market prices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch market prices',
      error: error.message
    });
  }
};
