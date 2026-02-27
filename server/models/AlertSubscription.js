const mongoose = require('mongoose');

const alertSubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fcmToken: {
    type: String,
    default: null
  },
  // Price Alert Subscriptions
  priceAlerts: [{
    commodity: {
      type: String,
      required: true
    },
    state: String,
    market: String,
    alertType: {
      type: String,
      enum: ['above', 'below', 'any_change'],
      default: 'any_change'
    },
    targetPrice: Number, // Price threshold
    percentageChange: {
      type: Number,
      default: 5 // Alert if price changes by this percentage
    },
    lastPrice: Number, // Last known price
    lastAlertSent: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  // Weather Alerts
  weatherAlerts: {
    enabled: {
      type: Boolean,
      default: true
    },
    location: {
      city: String,
      state: String,
      lat: Number,
      lon: Number
    },
    alertTypes: {
      rain: { type: Boolean, default: true },
      frost: { type: Boolean, default: true },
      heatwave: { type: Boolean, default: true },
      storm: { type: Boolean, default: true },
      humidity: { type: Boolean, default: false }
    },
    lastAlertSent: Date
  },
  // Scheme Alerts
  schemeAlerts: {
    enabled: {
      type: Boolean,
      default: true
    },
    categories: [{
      type: String,
      enum: ['subsidy', 'loan', 'insurance', 'training', 'equipment', 'infrastructure', 'marketing', 'other']
    }],
    states: [String], // State-specific schemes
    lastAlertSent: Date
  },
  // General Notification Preferences
  preferences: {
    dailyDigest: {
      type: Boolean,
      default: false
    },
    digestTime: {
      type: String,
      default: '08:00' // 8 AM
    },
    quietHoursStart: {
      type: String,
      default: '22:00' // 10 PM
    },
    quietHoursEnd: {
      type: String,
      default: '06:00' // 6 AM
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
alertSubscriptionSchema.index({ user: 1 });
alertSubscriptionSchema.index({ 'priceAlerts.commodity': 1 });
alertSubscriptionSchema.index({ 'weatherAlerts.enabled': 1 });
alertSubscriptionSchema.index({ isActive: 1 });

module.exports = mongoose.model('AlertSubscription', alertSubscriptionSchema);
