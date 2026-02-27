const mongoose = require('mongoose');

const diseaseDetectionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  cropType: {
    type: String,
    default: 'Unknown'
  },
  additionalInfo: {
    type: String
  },
  analysis: {
    type: String,
    required: true
  },
  originalAnalysis: {
    type: String
  },
  severity: {
    type: String,
    enum: ['healthy', 'mild', 'moderate', 'severe', 'unknown'],
    default: 'unknown'
  },
  detectedDisease: {
    type: String
  },
  language: {
    type: String,
    default: 'en'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
diseaseDetectionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('DiseaseDetection', diseaseDetectionSchema);
