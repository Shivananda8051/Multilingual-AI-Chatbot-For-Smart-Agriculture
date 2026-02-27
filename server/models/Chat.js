const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  originalLanguage: {
    type: String,
    default: 'en'
  },
  translatedContent: {
    type: String
  },
  feedback: {
    type: String,
    enum: ['helpful', 'not_helpful', null],
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const ChatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [MessageSchema],
  topic: {
    type: String,
    default: 'general'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
ChatSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Chat', ChatSchema);
