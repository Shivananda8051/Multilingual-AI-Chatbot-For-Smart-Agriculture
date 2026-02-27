const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Post content is required'],
    maxlength: [2000, 'Post cannot be more than 2000 characters']
  },
  media: [{
    type: {
      type: String,
      enum: ['image', 'video']
    },
    url: String,
    thumbnail: String
  }],
  hashtags: [{
    type: String,
    lowercase: true
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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
  }],
  category: {
    type: String,
    enum: ['general', 'tips', 'question', 'success', 'market', 'weather'],
    default: 'general'
  },
  language: {
    type: String,
    default: 'en'
  },
  location: {
    city: String,
    state: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for like count
PostSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
PostSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Index for feed queries
PostSchema.index({ createdAt: -1, isActive: 1 });
PostSchema.index({ user: 1, createdAt: -1 });
PostSchema.index({ hashtags: 1 });

// Ensure virtuals are included
PostSchema.set('toJSON', { virtuals: true });
PostSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Post', PostSchema);
