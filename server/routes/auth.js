const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// @route   POST /api/auth/firebase-login
// @desc    Login/Register with Firebase Phone Auth
// @access  Public
router.post('/firebase-login', authController.firebaseLogin);

// @route   POST /api/auth/send-otp
// @desc    Send OTP to mobile number (Legacy)
// @access  Public
router.post('/send-otp', authController.sendOTP);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and login/register (Legacy)
// @access  Public
router.post('/verify-otp', authController.verifyOTP);

// @route   POST /api/auth/send-whatsapp-otp
// @desc    Send OTP via WhatsApp (Twilio)
// @access  Public
router.post('/send-whatsapp-otp', authController.sendWhatsAppOTP);

// @route   POST /api/auth/send-sms-otp
// @desc    Send OTP via SMS (Twilio)
// @access  Public
router.post('/send-sms-otp', authController.sendSmsOTP);

// @route   POST /api/auth/verify-whatsapp-otp
// @desc    Verify WhatsApp/SMS OTP and login/register
// @access  Public
router.post('/verify-whatsapp-otp', authController.verifyWhatsAppOTP);

// @route   POST /api/auth/update-fcm-token
// @desc    Update FCM token for push notifications
// @access  Private
router.post('/update-fcm-token', protect, authController.updateFCMToken);

// @route   POST /api/auth/setup-profile
// @desc    Complete profile setup
// @access  Private
router.post('/setup-profile', protect, authController.setupProfile);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, authController.getMe);

// @route   POST /api/auth/admin/login
// @desc    Admin login (Legacy)
// @access  Public
router.post('/admin/login', authController.adminLogin);

// @route   POST /api/auth/admin/firebase-login
// @desc    Admin login with Firebase
// @access  Public
router.post('/admin/firebase-login', authController.adminFirebaseLogin);

module.exports = router;
