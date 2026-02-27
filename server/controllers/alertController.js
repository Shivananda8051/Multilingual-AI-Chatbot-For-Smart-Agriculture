const AlertSubscription = require('../models/AlertSubscription');
const firebaseService = require('../services/firebaseService');

// @desc    Get user's alert subscriptions
// @route   GET /api/alerts/subscriptions
// @access  Private
exports.getSubscriptions = async (req, res) => {
  try {
    let subscription = await AlertSubscription.findOne({ user: req.user._id });

    if (!subscription) {
      subscription = {
        priceAlerts: [],
        weatherAlerts: { enabled: false },
        schemeAlerts: { enabled: false },
        preferences: {}
      };
    }

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscriptions'
    });
  }
};

// @desc    Register FCM token
// @route   POST /api/alerts/register-token
// @access  Private
exports.registerToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    let subscription = await AlertSubscription.findOne({ user: req.user._id });

    if (subscription) {
      subscription.fcmToken = fcmToken;
      await subscription.save();
    } else {
      subscription = await AlertSubscription.create({
        user: req.user._id,
        fcmToken,
        priceAlerts: [],
        weatherAlerts: { enabled: true },
        schemeAlerts: { enabled: true }
      });
    }

    res.json({
      success: true,
      message: 'FCM token registered successfully'
    });
  } catch (error) {
    console.error('Register token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register token'
    });
  }
};

// @desc    Add price alert subscription
// @route   POST /api/alerts/price
// @access  Private
exports.addPriceAlert = async (req, res) => {
  try {
    const { commodity, state, market, alertType, targetPrice, percentageChange } = req.body;

    if (!commodity) {
      return res.status(400).json({
        success: false,
        message: 'Commodity is required'
      });
    }

    let subscription = await AlertSubscription.findOne({ user: req.user._id });

    // Auto-create subscription if doesn't exist
    if (!subscription) {
      subscription = new AlertSubscription({
        user: req.user._id,
        priceAlerts: []
      });
    }

    // Check if already subscribed to this commodity
    const existingAlert = subscription.priceAlerts.find(
      alert => alert.commodity.toLowerCase() === commodity.toLowerCase() &&
               alert.state === state
    );

    if (existingAlert) {
      // Update existing alert
      existingAlert.alertType = alertType || existingAlert.alertType;
      existingAlert.targetPrice = targetPrice || existingAlert.targetPrice;
      existingAlert.percentageChange = percentageChange || existingAlert.percentageChange;
      existingAlert.market = market || existingAlert.market;
      existingAlert.isActive = true;
    } else {
      // Add new alert
      subscription.priceAlerts.push({
        commodity,
        state,
        market,
        alertType: alertType || 'any_change',
        targetPrice,
        percentageChange: percentageChange || 5,
        isActive: true
      });
    }

    await subscription.save();

    res.json({
      success: true,
      message: `Price alert for ${commodity} added successfully`,
      data: subscription.priceAlerts
    });
  } catch (error) {
    console.error('Add price alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add price alert'
    });
  }
};

// @desc    Remove price alert subscription
// @route   DELETE /api/alerts/price/:alertId
// @access  Private
exports.removePriceAlert = async (req, res) => {
  try {
    const { alertId } = req.params;

    const subscription = await AlertSubscription.findOne({ user: req.user._id });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No subscriptions found'
      });
    }

    subscription.priceAlerts = subscription.priceAlerts.filter(
      alert => alert._id.toString() !== alertId
    );

    await subscription.save();

    res.json({
      success: true,
      message: 'Price alert removed successfully',
      data: subscription.priceAlerts
    });
  } catch (error) {
    console.error('Remove price alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove price alert'
    });
  }
};

// @desc    Update weather alerts
// @route   PUT /api/alerts/weather
// @access  Private
exports.updateWeatherAlerts = async (req, res) => {
  try {
    const { enabled, location, alertTypes } = req.body;

    let subscription = await AlertSubscription.findOne({ user: req.user._id });

    // Auto-create subscription if doesn't exist
    if (!subscription) {
      subscription = new AlertSubscription({
        user: req.user._id,
        priceAlerts: []
      });
    }

    // Safely update weatherAlerts
    if (!subscription.weatherAlerts) {
      subscription.weatherAlerts = {};
    }

    if (enabled !== undefined) {
      subscription.weatherAlerts.enabled = enabled;
    }
    if (location) {
      subscription.weatherAlerts.location = location;
    }
    if (alertTypes) {
      subscription.weatherAlerts.alertTypes = alertTypes;
    }

    await subscription.save();

    res.json({
      success: true,
      message: 'Weather alerts updated successfully',
      data: subscription.weatherAlerts
    });
  } catch (error) {
    console.error('Update weather alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update weather alerts'
    });
  }
};

// @desc    Update scheme alerts
// @route   PUT /api/alerts/schemes
// @access  Private
exports.updateSchemeAlerts = async (req, res) => {
  try {
    const { enabled, categories, states } = req.body;

    let subscription = await AlertSubscription.findOne({ user: req.user._id });

    // Auto-create subscription if doesn't exist
    if (!subscription) {
      subscription = new AlertSubscription({
        user: req.user._id,
        priceAlerts: []
      });
    }

    // Safely update schemeAlerts
    if (!subscription.schemeAlerts) {
      subscription.schemeAlerts = {};
    }

    if (enabled !== undefined) {
      subscription.schemeAlerts.enabled = enabled;
    }
    if (categories) {
      subscription.schemeAlerts.categories = categories;
    }
    if (states) {
      subscription.schemeAlerts.states = states;
    }

    await subscription.save();

    res.json({
      success: true,
      message: 'Scheme alerts updated successfully',
      data: subscription.schemeAlerts
    });
  } catch (error) {
    console.error('Update scheme alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update scheme alerts'
    });
  }
};

// @desc    Update notification preferences
// @route   PUT /api/alerts/preferences
// @access  Private
exports.updatePreferences = async (req, res) => {
  try {
    const { dailyDigest, digestTime, quietHoursStart, quietHoursEnd, language } = req.body;

    let subscription = await AlertSubscription.findOne({ user: req.user._id });

    // Auto-create subscription if doesn't exist
    if (!subscription) {
      subscription = new AlertSubscription({
        user: req.user._id,
        priceAlerts: []
      });
    }

    // Safely update preferences
    if (!subscription.preferences) {
      subscription.preferences = {};
    }

    if (dailyDigest !== undefined) {
      subscription.preferences.dailyDigest = dailyDigest;
    }
    if (digestTime) {
      subscription.preferences.digestTime = digestTime;
    }
    if (quietHoursStart) {
      subscription.preferences.quietHoursStart = quietHoursStart;
    }
    if (quietHoursEnd) {
      subscription.preferences.quietHoursEnd = quietHoursEnd;
    }
    if (language) {
      subscription.preferences.language = language;
    }

    await subscription.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: subscription.preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences'
    });
  }
};

// @desc    Send test notification
// @route   POST /api/alerts/test
// @access  Private
exports.sendTestNotification = async (req, res) => {
  try {
    const subscription = await AlertSubscription.findOne({ user: req.user._id });

    if (!subscription || !subscription.fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'Push notifications not enabled. Your alert settings are saved and will work when push notifications are configured.'
      });
    }

    await firebaseService.sendPushNotification(
      subscription.fcmToken,
      'AgriBot Test Notification',
      'Your notifications are working! You will receive price alerts, weather warnings, and scheme updates.',
      { type: 'test' }
    );

    res.json({
      success: true,
      message: 'Test notification sent successfully'
    });
  } catch (error) {
    console.error('Send test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Push notifications not configured yet. Your alert settings are saved.'
    });
  }
};
