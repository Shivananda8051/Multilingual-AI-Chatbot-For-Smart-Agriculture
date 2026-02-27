const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ReelSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  category: {
    type: String,
    enum: ['farming_tips', 'crop_care', 'irrigation', 'organic_farming', 'pest_control', 'harvesting', 'equipment', 'success_stories', 'weather', 'market'],
    default: 'farming_tips'
  },
  video: {
    url: {
      type: String,
      required: true
    },
    thumbnail: String,
    duration: Number // in seconds
  },
  tags: [{
    type: String
  }],
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [CommentSchema],
  shares: {
    type: Number,
    default: 0
  },
  sharedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isUserSubmission: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
ReelSchema.index({ isActive: 1, order: 1 });
ReelSchema.index({ category: 1, isActive: 1 });
ReelSchema.index({ isFeatured: 1, isActive: 1 });

module.exports = mongoose.model('Reel', ReelSchema);
