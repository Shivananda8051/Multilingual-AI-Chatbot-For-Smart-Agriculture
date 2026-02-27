const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getSubscriptions,
  registerToken,
  addPriceAlert,
  removePriceAlert,
  updateWeatherAlerts,
  updateSchemeAlerts,
  updatePreferences,
  sendTestNotification
} = require('../controllers/alertController');

// All routes require authentication
router.use(protect);

// Get subscriptions
router.get('/subscriptions', getSubscriptions);

// Register FCM token
router.post('/register-token', registerToken);

// Price alerts
router.post('/price', addPriceAlert);
router.delete('/price/:alertId', removePriceAlert);

// Weather alerts
router.put('/weather', updateWeatherAlerts);

// Scheme alerts
router.put('/schemes', updateSchemeAlerts);

// Preferences
router.put('/preferences', updatePreferences);

// Test notification
router.post('/test', sendTestNotification);

module.exports = router;
