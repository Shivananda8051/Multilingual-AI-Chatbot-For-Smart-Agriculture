const mongoose = require('mongoose');

const CropActivitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cropCalendar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CropCalendar',
    required: true
  },
  activityType: {
    type: String,
    enum: [
      'sowing_reminder',
      'irrigation',
      'fertilizer',
      'pesticide',
      'weeding',
      'thinning',
      'pruning',
      'harvest_reminder',
      'soil_test',
      'custom'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTime: {
    type: String,
    default: '08:00'
  },
  reminderDaysBefore: {
    type: [Number],
    default: [0, 1]
  },
  status: {
    type: String,
    enum: ['pending', 'notified', 'completed', 'skipped', 'overdue'],
    default: 'pending'
  },
  completedAt: Date,
  completionNotes: String,
  notificationsSent: [{
    sentAt: Date,
    channel: {
      type: String,
      enum: ['push', 'inApp', 'sms']
    },
    success: Boolean
  }],
  isRecurring: { type: Boolean, default: false },
  recurrencePattern: {
    type: String,
    enum: ['daily', 'weekly', 'biweekly', 'monthly', 'custom']
  },
  recurrenceInterval: Number,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  }
}, {
  timestamps: true
});

CropActivitySchema.index({ user: 1, scheduledDate: 1, status: 1 });
CropActivitySchema.index({ scheduledDate: 1, status: 1 });
CropActivitySchema.index({ cropCalendar: 1 });

module.exports = mongoose.model('CropActivity', CropActivitySchema);
