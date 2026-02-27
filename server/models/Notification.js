const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['weather', 'news', 'follow', 'like', 'comment', 'system', 'iot_alert', 'marketplace', 'scheme_application', 'crop_calendar', 'price_alert'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isSent: {
    type: Boolean,
    default: false
  },
  sentVia: {
    type: String,
    enum: ['sms', 'inApp', 'both'],
    default: 'inApp'
  }
}, {
  timestamps: true
});

NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
