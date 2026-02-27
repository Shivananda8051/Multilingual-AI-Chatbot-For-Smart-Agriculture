const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');
const { protect } = require('../middleware/auth');

// @route   GET /api/weather/city
// @desc    Get current weather by city name
// @access  Private
router.get('/city', protect, weatherController.getWeatherByCity);

// @route   GET /api/weather/current
// @desc    Get current weather by coordinates
// @access  Private
router.get('/current', protect, weatherController.getCurrentWeather);

// @route   GET /api/weather/forecast
// @desc    Get 7-day weather forecast
// @access  Private
router.get('/forecast', protect, weatherController.getForecast);

// @route   GET /api/weather/advice
// @desc    Get weather-based farming advice
// @access  Private
router.get('/advice', protect, weatherController.getWeatherAdvice);

module.exports = router;
