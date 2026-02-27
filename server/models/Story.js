const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  media: {
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    thumbnail: String
  },
  caption: {
    type: String,
    maxlength: 200
  },
  views: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for auto-expiry queries
StorySchema.index({ expiresAt: 1 });
StorySchema.index({ user: 1, createdAt: -1 });

// Virtual for checking if story is expired
StorySchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt;
});

// Static method to get active stories
StorySchema.statics.getActiveStories = function() {
  return this.find({
    expiresAt: { $gt: new Date() },
    isActive: true
  }).populate('user', 'name avatar');
};

module.exports = mongoose.model('Story', StorySchema);
