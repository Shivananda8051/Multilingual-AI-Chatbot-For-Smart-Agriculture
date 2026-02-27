const Settings = require('../models/Settings');
const twilioService = require('../services/twilioService');

// @desc    Get all settings (admin only)
// @route   GET /api/settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.find().populate('updatedBy', 'name phone');

    // Convert to object format
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = {
        value: s.value,
        description: s.description,
        updatedAt: s.updatedAt,
        updatedBy: s.updatedBy
      };
    });

    res.status(200).json({
      success: true,
      settings: settingsObj
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get settings'
    });
  }
};

// @desc    Get a specific setting
// @route   GET /api/settings/:key
exports.getSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const value = await Settings.getSetting(key);

    res.status(200).json({
      success: true,
      key,
      value
    });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get setting'
    });
  }
};

// @desc    Update a setting (admin only)
// @route   PUT /api/settings/:key
exports.updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Value is required'
      });
    }

    const setting = await Settings.findOneAndUpdate(
      { key },
      {
        value,
        updatedBy: req.user._id
      },
      { new: true }
    ).populate('updatedBy', 'name phone');

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    res.status(200).json({
      success: true,
      setting: {
        key: setting.key,
        value: setting.value,
        description: setting.description,
        updatedAt: setting.updatedAt,
        updatedBy: setting.updatedBy
      }
    });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update setting'
    });
  }
};

// @desc    Toggle OTP service
// @route   POST /api/settings/toggle-otp
exports.toggleOTPService = async (req, res) => {
  try {
    const currentValue = await Settings.getSetting('otpServiceEnabled', false);
    const newValue = !currentValue;

    const setting = await Settings.setSetting(
      'otpServiceEnabled',
      newValue,
      'Enable real OTP sending via Twilio (WhatsApp/SMS). When disabled, OTP is shown in response for development.',
      req.user._id
    );

    res.status(200).json({
      success: true,
      otpServiceEnabled: newValue,
      message: newValue ? 'OTP service enabled - Real SMS/WhatsApp will be sent' : 'OTP service disabled - Development mode active'
    });
  } catch (error) {
    console.error('Toggle OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle OTP service'
    });
  }
};

// @desc    Get OTP service status (public - needed for login page)
// @route   GET /api/settings/otp-status
exports.getOTPStatus = async (req, res) => {
  try {
    const enabled = await Settings.getSetting('otpServiceEnabled', false);

    res.status(200).json({
      success: true,
      otpServiceEnabled: enabled
    });
  } catch (error) {
    console.error('Get OTP status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get OTP status'
    });
  }
};

// @desc    Get verified phone numbers for OTP testing
// @route   GET /api/settings/verified-numbers
exports.getVerifiedNumbers = async (req, res) => {
  try {
    const numbers = await Settings.getSetting('verifiedPhoneNumbers', []);

    res.status(200).json({
      success: true,
      verifiedNumbers: numbers
    });
  } catch (error) {
    console.error('Get verified numbers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get verified numbers'
    });
  }
};

// @desc    Add a verified phone number for OTP testing
// @route   POST /api/settings/verified-numbers
exports.addVerifiedNumber = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Format the phone number
    let formattedPhone = phone.replace(/\s+/g, '').replace(/-/g, '');
    if (!formattedPhone.startsWith('+')) {
      // Assume Indian number if 10 digits
      if (formattedPhone.length === 10 && /^[6-9]\d{9}$/.test(formattedPhone)) {
        formattedPhone = '+91' + formattedPhone;
      } else {
        formattedPhone = '+' + formattedPhone;
      }
    }

    const currentNumbers = await Settings.getSetting('verifiedPhoneNumbers', []);

    // Check if already exists
    if (currentNumbers.includes(formattedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already verified'
      });
    }

    // Add the new number
    const updatedNumbers = [...currentNumbers, formattedPhone];

    await Settings.setSetting(
      'verifiedPhoneNumbers',
      updatedNumbers,
      'List of verified phone numbers for OTP testing',
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: `Phone number ${formattedPhone} added to verified list`,
      verifiedNumbers: updatedNumbers
    });
  } catch (error) {
    console.error('Add verified number error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add verified number'
    });
  }
};

// @desc    Remove a verified phone number
// @route   DELETE /api/settings/verified-numbers/:phone
exports.removeVerifiedNumber = async (req, res) => {
  try {
    const { phone } = req.params;

    const currentNumbers = await Settings.getSetting('verifiedPhoneNumbers', []);
    const updatedNumbers = currentNumbers.filter(n => n !== phone && n !== decodeURIComponent(phone));

    await Settings.setSetting(
      'verifiedPhoneNumbers',
      updatedNumbers,
      'List of verified phone numbers for OTP testing',
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: 'Phone number removed from verified list',
      verifiedNumbers: updatedNumbers
    });
  } catch (error) {
    console.error('Remove verified number error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove verified number'
    });
  }
};

// @desc    Send test OTP to a phone number (SMS and/or WhatsApp)
// @route   POST /api/settings/send-test-otp
exports.sendTestOTP = async (req, res) => {
  try {
    const { phone, method } = req.body; // method: 'sms', 'whatsapp', or 'both'

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Generate a test OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const results = { sms: null, whatsapp: null };

    // Send SMS OTP
    if (method === 'sms' || method === 'both') {
      try {
        const smsResult = await twilioService.sendOTP(phone, otp);
        results.sms = { success: true, messageId: smsResult.messageId };
      } catch (smsError) {
        results.sms = { success: false, error: smsError.message };
      }
    }

    // Send WhatsApp OTP
    if (method === 'whatsapp' || method === 'both') {
      try {
        const waResult = await twilioService.sendWhatsAppOTP(phone, otp);
        results.whatsapp = { success: true, messageId: waResult.messageId };
      } catch (waError) {
        results.whatsapp = { success: false, error: waError.message };
      }
    }

    // Determine overall success
    const anySuccess = (results.sms?.success || results.whatsapp?.success);

    res.status(anySuccess ? 200 : 500).json({
      success: anySuccess,
      otp: otp, // Return OTP for testing purposes
      results,
      message: anySuccess
        ? `Test OTP sent: ${otp}`
        : 'Failed to send OTP via all methods'
    });
  } catch (error) {
    console.error('Send test OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send test OTP'
    });
  }
};
