const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Static method to get a setting
settingsSchema.statics.getSetting = async function(key, defaultValue = null) {
  const setting = await this.findOne({ key });
  return setting ? setting.value : defaultValue;
};

// Static method to set a setting
settingsSchema.statics.setSetting = async function(key, value, description = '', userId = null) {
  const setting = await this.findOneAndUpdate(
    { key },
    {
      value,
      description,
      updatedBy: userId
    },
    { upsert: true, new: true }
  );
  return setting;
};

// Initialize default settings
settingsSchema.statics.initDefaults = async function() {
  const defaults = [
    {
      key: 'otpServiceEnabled',
      value: false,
      description: 'Enable real OTP sending via Twilio (WhatsApp/SMS). When disabled, OTP is shown in response for development.'
    }
  ];

  for (const setting of defaults) {
    const exists = await this.findOne({ key: setting.key });
    if (!exists) {
      await this.create(setting);
    }
  }
};

module.exports = mongoose.model('Settings', settingsSchema);
