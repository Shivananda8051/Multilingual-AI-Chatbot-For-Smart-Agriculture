const mongoose = require('mongoose');
const crypto = require('crypto');

const IoTDeviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  secretKey: {
    type: String,
    required: true
  },
  name: {
    type: String,
    default: 'My Sensor'
  },
  type: {
    type: String,
    enum: ['soil_sensor', 'weather_station', 'water_pump', 'irrigation_controller', 'multi_sensor'],
    default: 'multi_sensor'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isRegistered: {
    type: Boolean,
    default: false
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: null
  },
  lastData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  firmware: {
    version: { type: String, default: '1.0.0' },
    lastUpdate: Date
  },
  location: {
    fieldName: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  sensors: [{
    type: {
      type: String,
      enum: ['soil_moisture', 'temperature', 'humidity', 'ph', 'light', 'rain', 'wind', 'water_level']
    },
    enabled: { type: Boolean, default: true },
    unit: String,
    thresholds: {
      min: Number,
      max: Number
    }
  }],
  settings: {
    reportInterval: { type: Number, default: 60 }, // seconds
    alertsEnabled: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

// Generate unique device ID and secret key
IoTDeviceSchema.statics.generateDeviceCredentials = function() {
  const deviceId = 'AGRI-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  const secretKey = crypto.randomBytes(16).toString('hex');
  return { deviceId, secretKey };
};

// Verify device secret
IoTDeviceSchema.methods.verifySecret = function(secret) {
  return this.secretKey === secret;
};

// Update last seen (called when device sends data)
IoTDeviceSchema.methods.updateHeartbeat = async function(data = {}) {
  this.isOnline = true;
  this.lastSeen = new Date();
  if (Object.keys(data).length > 0) {
    this.lastData = data;
  }
  await this.save();
};

// Static method to mark offline devices (devices not seen in 5 minutes)
IoTDeviceSchema.statics.markOfflineDevices = async function() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  await this.updateMany(
    { isOnline: true, lastSeen: { $lt: fiveMinutesAgo } },
    { isOnline: false }
  );
};

// Generate QR code data
IoTDeviceSchema.methods.getQRData = function() {
  return `agribot://device/${this.deviceId}?key=${this.secretKey}`;
};

module.exports = mongoose.model('IoTDevice', IoTDeviceSchema);
