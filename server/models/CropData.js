const mongoose = require('mongoose');

const CropDataSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  localNames: {
    hi: String,
    ta: String,
    te: String,
    kn: String,
    ml: String,
    bn: String,
    mr: String
  },
  category: {
    type: String,
    enum: ['cereals', 'pulses', 'vegetables', 'fruits', 'oilseeds', 'spices', 'cash_crops', 'fodder'],
    required: true
  },
  seasons: [{
    region: {
      type: String,
      enum: ['north', 'south', 'east', 'west', 'central', 'northeast'],
      required: true
    },
    states: [String],
    sowingStartMonth: { type: Number, min: 1, max: 12 },
    sowingEndMonth: { type: Number, min: 1, max: 12 },
    harvestStartMonth: { type: Number, min: 1, max: 12 },
    harvestEndMonth: { type: Number, min: 1, max: 12 },
    daysToGermination: Number,
    daysToFlowering: Number,
    daysToHarvest: Number,
    seasonType: {
      type: String,
      enum: ['kharif', 'rabi', 'zaid', 'year_round']
    }
  }],
  requirements: {
    soilType: [String],
    phRange: { min: Number, max: Number },
    temperatureRange: { min: Number, max: Number },
    rainfallRange: { min: Number, max: Number }
  },
  rotation: {
    goodSuccessors: [String],
    badSuccessors: [String],
    companions: [String],
    family: String,
    soilEffect: {
      type: String,
      enum: ['nitrogen_fixer', 'heavy_feeder', 'light_feeder', 'neutral']
    }
  },
  activities: [{
    name: String,
    daysFromSowing: Number,
    description: String,
    tips: String
  }],
  imageUrl: String,
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

CropDataSchema.index({ category: 1 });
CropDataSchema.index({ 'seasons.region': 1 });
CropDataSchema.index({ 'seasons.states': 1 });

module.exports = mongoose.model('CropData', CropDataSchema);
