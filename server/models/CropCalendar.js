const mongoose = require('mongoose');

const CropCalendarSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  crop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CropData',
    required: true
  },
  cropName: {
    type: String,
    required: true
  },
  fieldName: {
    type: String,
    default: 'Main Field'
  },
  fieldArea: {
    value: Number,
    unit: {
      type: String,
      enum: ['acres', 'hectares', 'bigha', 'guntha'],
      default: 'acres'
    }
  },
  plannedSowingDate: {
    type: Date,
    required: true
  },
  actualSowingDate: Date,
  expectedHarvestDate: Date,
  actualHarvestDate: Date,
  status: {
    type: String,
    enum: ['planned', 'sowing', 'growing', 'flowering', 'harvesting', 'completed', 'failed'],
    default: 'planned'
  },
  season: {
    type: String,
    enum: ['kharif', 'rabi', 'zaid', 'year_round']
  },
  year: Number,
  currentPhase: {
    type: String,
    enum: ['pre_sowing', 'germination', 'vegetative', 'flowering', 'fruiting', 'maturity', 'harvest']
  },
  progressPercentage: { type: Number, default: 0 },
  notes: String,
  weatherAtPlanting: {
    temp: Number,
    humidity: Number,
    rainfall: Number
  },
  expectedYield: {
    value: Number,
    unit: String
  },
  actualYield: {
    value: Number,
    unit: String
  },
  color: {
    type: String,
    default: '#4CAF50'
  }
}, {
  timestamps: true
});

CropCalendarSchema.index({ user: 1, status: 1 });
CropCalendarSchema.index({ user: 1, plannedSowingDate: 1 });
CropCalendarSchema.index({ user: 1, expectedHarvestDate: 1 });
CropCalendarSchema.index({ user: 1, year: 1, season: 1 });

module.exports = mongoose.model('CropCalendar', CropCalendarSchema);
