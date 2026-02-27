const mongoose = require('mongoose');

const IoTDataSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deviceId: {
    type: String,
    required: true
  },
  deviceName: {
    type: String,
    default: 'Sensor'
  },
  sensorType: {
    type: String,
    enum: ['soil_moisture', 'temperature', 'humidity', 'ph', 'light', 'rain', 'wind'],
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  location: {
    fieldName: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  thresholds: {
    min: Number,
    max: Number
  },
  status: {
    type: String,
    enum: ['normal', 'warning', 'critical'],
    default: 'normal'
  }
}, {
  timestamps: true
});

// Index for time-series queries
IoTDataSchema.index({ user: 1, sensorType: 1, createdAt: -1 });
IoTDataSchema.index({ deviceId: 1, createdAt: -1 });

module.exports = mongoose.model('IoTData', IoTDataSchema);
