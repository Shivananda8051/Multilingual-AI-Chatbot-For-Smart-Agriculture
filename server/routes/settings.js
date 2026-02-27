const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect, admin } = require('../middleware/auth');

// Public route - needed for login page to know if OTP service is enabled
router.get('/otp-status', settingsController.getOTPStatus);

// Protected admin routes
router.get('/', protect, admin, settingsController.getSettings);
router.post('/toggle-otp', protect, admin, settingsController.toggleOTPService);

// Verified phone numbers for OTP testing
router.get('/verified-numbers', protect, admin, settingsController.getVerifiedNumbers);
router.post('/verified-numbers', protect, admin, settingsController.addVerifiedNumber);
router.delete('/verified-numbers/:phone', protect, admin, settingsController.removeVerifiedNumber);

// Send test OTP
router.post('/send-test-otp', protect, admin, settingsController.sendTestOTP);

// Generic setting routes (keep at the end due to :key parameter)
router.get('/:key', protect, admin, settingsController.getSetting);
router.put('/:key', protect, admin, settingsController.updateSetting);

module.exports = router;
