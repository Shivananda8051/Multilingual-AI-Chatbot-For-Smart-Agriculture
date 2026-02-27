const express = require('express');
const router = express.Router();
const mandiController = require('../controllers/mandiController');

// All routes are public - no authentication required for market prices
// This allows farmers to check prices without logging in

// Get mandi prices with filters
router.get('/prices', mandiController.getPrices);

// Get available states
router.get('/states', mandiController.getStates);

// Get trending commodities
router.get('/trending', mandiController.getTrending);

// Get prices for a specific commodity
router.get('/commodity/:name', mandiController.getCommodityPrices);

// Get price comparison for a commodity across markets
router.get('/compare/:commodity', mandiController.getPriceComparison);

// Get prices by state
router.get('/state/:state', mandiController.getStatePrices);

// Get prices from a specific market
router.get('/market/:name', mandiController.getMarketPrices);

module.exports = router;
