const User = require('../models/User');
const Settings = require('../models/Settings');
const AlertSubscription = require('../models/AlertSubscription');
const firebaseService = require('../services/firebaseService');
const twilioService = require('../services/twilioService');

// @desc    Verify Firebase token and login/register user
// @route   POST /api/auth/firebase-login
exports.firebaseLogin = async (req, res) => {
  try {
    const { idToken, fcmToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Firebase ID token is required'
      });
    }

    // Verify the Firebase ID token
    const { uid, phone } = await firebaseService.verifyIdToken(idToken);

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number not found in token'
      });
    }

    // Find or create user
    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({
        phone,
        firebaseUid: uid
      });
    } else {
      // Update Firebase UID if not set
      if (!user.firebaseUid) {
        user.firebaseUid = uid;
      }
    }

    // Update FCM token for push notifications
    if (fcmToken) {
      user.fcmToken = fcmToken;
    }

    await user.save();

    // Generate JWT token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        avatar: user.avatar,
        isProfileComplete: user.isProfileComplete,
        preferredLanguage: user.preferredLanguage,
        role: user.role,
        isCommunityMember: user.isCommunityMember,
        communityJoinedAt: user.communityJoinedAt
      }
    });
  } catch (error) {
    console.error('Firebase login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to authenticate with Firebase'
    });
  }
};

// @desc    Send OTP to mobile number (Legacy - kept for backwards compatibility)
// @route   POST /api/auth/send-otp
exports.sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Find or create user
    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({ phone });
    }

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // In development, log OTP to console
    // For production, use Firebase Phone Auth on client side
    if (process.env.NODE_ENV === 'development') {
      console.log(`Development OTP for ${phone}: ${otp}`);
    }

    res.status(200).json({
      success: true,
      message: 'Please use Firebase Phone Authentication on the client side',
      // Only include OTP in development for testing
      ...(process.env.NODE_ENV === 'development' && { otp })
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send OTP'
    });
  }
};

// @desc    Send OTP via WhatsApp
// @route   POST /api/auth/send-whatsapp-otp
exports.sendWhatsAppOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Find or create user
    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({ phone });
    }

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // Check if OTP service is enabled
    const otpServiceEnabled = await Settings.getSetting('otpServiceEnabled', false);

    if (otpServiceEnabled) {
      // Send real OTP via WhatsApp
      try {
        await twilioService.sendWhatsAppOTP(phone, otp);
        console.log(`WhatsApp OTP sent to ${phone}`);

        res.status(200).json({
          success: true,
          message: 'OTP sent to your WhatsApp'
        });
      } catch (twilioError) {
        console.error('Twilio WhatsApp error:', twilioError.message);
        res.status(500).json({
          success: false,
          message: twilioError.message || 'Failed to send WhatsApp OTP. Please try SMS instead.',
          error: twilioError.message
        });
      }
    } else {
      // Development mode - return OTP in response
      console.log(`[DEV MODE] WhatsApp OTP for ${phone}: ${otp}`);
      res.status(200).json({
        success: true,
        message: 'Development Mode - OTP shown below',
        otp,
        devMode: true
      });
    }
  } catch (error) {
    console.error('Send WhatsApp OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send WhatsApp OTP'
    });
  }
};

// @desc    Send OTP via SMS (Twilio)
// @route   POST /api/auth/send-sms-otp
exports.sendSmsOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Find or create user
    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({ phone });
    }

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // Check if OTP service is enabled
    const otpServiceEnabled = await Settings.getSetting('otpServiceEnabled', false);

    if (otpServiceEnabled) {
      // Send real OTP via SMS
      try {
        await twilioService.sendOTP(phone, otp);
        console.log(`SMS OTP sent to ${phone}`);

        res.status(200).json({
          success: true,
          message: 'OTP sent via SMS'
        });
      } catch (twilioError) {
        console.error('Twilio SMS error:', twilioError.message);
        res.status(500).json({
          success: false,
          message: twilioError.message || 'Failed to send SMS OTP. Please try WhatsApp instead.',
          error: twilioError.message
        });
      }
    } else {
      // Development mode - return OTP in response
      console.log(`[DEV MODE] SMS OTP for ${phone}: ${otp}`);
      res.status(200).json({
        success: true,
        message: 'Development Mode - OTP shown below',
        otp,
        devMode: true
      });
    }
  } catch (error) {
    console.error('Send SMS OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send SMS OTP'
    });
  }
};

// @desc    Verify WhatsApp OTP and login
// @route   POST /api/auth/verify-whatsapp-otp
exports.verifyWhatsAppOTP = async (req, res) => {
  try {
    const { phone, otp, fcmToken } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required'
      });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify OTP
    if (!user.verifyOTP(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Clear OTP after successful verification
    user.otp = undefined;

    // Update FCM token if provided
    if (fcmToken) {
      user.fcmToken = fcmToken;
    }

    await user.save();

    // Generate JWT token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        avatar: user.avatar,
        isProfileComplete: user.isProfileComplete,
        preferredLanguage: user.preferredLanguage,
        role: user.role,
        isCommunityMember: user.isCommunityMember,
        communityJoinedAt: user.communityJoinedAt
      }
    });
  } catch (error) {
    console.error('Verify WhatsApp OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
};

// @desc    Verify OTP and login (Legacy - kept for backwards compatibility)
// @route   POST /api/auth/verify-otp
exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required'
      });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify OTP
    if (!user.verifyOTP(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Clear OTP after successful verification
    user.otp = undefined;
    await user.save();

    // Generate JWT token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        avatar: user.avatar,
        isProfileComplete: user.isProfileComplete,
        preferredLanguage: user.preferredLanguage,
        role: user.role,
        isCommunityMember: user.isCommunityMember,
        communityJoinedAt: user.communityJoinedAt
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
};

// @desc    Update FCM token for push notifications
// @route   POST /api/auth/update-fcm-token
exports.updateFCMToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.fcmToken = fcmToken;
    await user.save();

    // Also sync FCM token to AlertSubscription for push notifications
    let alertSubscription = await AlertSubscription.findOne({ user: req.user._id });
    if (alertSubscription) {
      alertSubscription.fcmToken = fcmToken;
      await alertSubscription.save();
    } else {
      // Create new alert subscription with FCM token
      await AlertSubscription.create({
        user: req.user._id,
        fcmToken,
        priceAlerts: [],
        weatherAlerts: { enabled: true },
        schemeAlerts: { enabled: true }
      });
    }

    res.status(200).json({
      success: true,
      message: 'FCM token updated successfully'
    });
  } catch (error) {
    console.error('Update FCM token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update FCM token'
    });
  }
};

// @desc    Complete profile setup
// @route   POST /api/auth/setup-profile
exports.setupProfile = async (req, res) => {
  try {
    const { name, location, cropsGrown, preferredLanguage, farmDetails } = req.body;

    // Validate name is required
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update profile
    user.name = name.trim();
    user.location = location || user.location;
    user.cropsGrown = cropsGrown || user.cropsGrown;
    user.preferredLanguage = preferredLanguage || user.preferredLanguage;
    user.farmDetails = farmDetails || user.farmDetails;
    user.isProfileComplete = true;

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        avatar: user.avatar,
        location: user.location,
        cropsGrown: user.cropsGrown,
        isProfileComplete: user.isProfileComplete,
        preferredLanguage: user.preferredLanguage,
        isCommunityMember: user.isCommunityMember,
        communityJoinedAt: user.communityJoinedAt
      }
    });
  } catch (error) {
    console.error('Profile setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to setup profile'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-otp')
      .populate('followers', 'name avatar')
      .populate('following', 'name avatar');

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get user'
    });
  }
};

// @desc    Admin login
// @route   POST /api/auth/admin/login
exports.adminLogin = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const user = await User.findOne({ phone, role: 'admin' });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    if (!user.verifyOTP(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    user.otp = undefined;
    await user.save();

    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Admin login failed'
    });
  }
};

// @desc    Admin Firebase login
// @route   POST /api/auth/admin/firebase-login
exports.adminFirebaseLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Firebase ID token is required'
      });
    }

    // Verify the Firebase ID token
    const { uid, phone } = await firebaseService.verifyIdToken(idToken);

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number not found in token'
      });
    }

    // Find admin user
    const user = await User.findOne({ phone, role: 'admin' });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Update Firebase UID if not set
    if (!user.firebaseUid) {
      user.firebaseUid = uid;
      await user.save();
    }

    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Admin Firebase login error:', error);
    res.status(500).json({
      success: false,
      message: 'Admin login failed'
    });
  }
};
