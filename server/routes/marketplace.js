const express = require('express');
const router = express.Router();
const marketplaceController = require('../controllers/marketplaceController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes (optional auth for personalization)
router.get('/options', marketplaceController.getOptions);

// Protected routes
router.use(protect);

// Listings
router.get('/listings', marketplaceController.getListings);
router.get('/listings/:id', marketplaceController.getListing);
router.post('/listings', upload.array('images', 5), marketplaceController.createListing);
router.put('/listings/:id', upload.array('images', 5), marketplaceController.updateListing);
router.delete('/listings/:id', marketplaceController.deleteListing);

// User-specific
router.get('/my-listings', marketplaceController.getMyListings);
router.get('/saved', marketplaceController.getSavedListings);

// Engagement
router.post('/listings/:id/save', marketplaceController.toggleSaveListing);
router.post('/listings/:id/inquiry', marketplaceController.recordInquiry);

// Mandi prices
router.get('/mandi-prices', marketplaceController.getMandiPrices);
router.get('/price-compare/:id', marketplaceController.getPriceComparison);
router.get('/trending', marketplaceController.getTrendingCrops);

module.exports = router;
