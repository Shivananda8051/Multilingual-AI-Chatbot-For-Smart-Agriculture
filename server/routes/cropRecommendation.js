const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getRecommendations,
  getProfitEstimation,
  getSowingCalendar,
  getOptions,
  getAllCrops
} = require('../controllers/cropRecommendationController');

// All routes require authentication
router.use(protect);

// Get recommendation options
router.get('/options', getOptions);

// Get all crops info
router.get('/crops', getAllCrops);

// Get sowing calendar
router.get('/calendar', getSowingCalendar);

// Get crop recommendations
router.post('/recommend', getRecommendations);

// Get profit estimation
router.post('/profit', getProfitEstimation);

module.exports = router;
