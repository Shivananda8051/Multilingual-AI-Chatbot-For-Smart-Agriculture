const express = require('express');
const router = express.Router();
const iotController = require('../controllers/iotController');
const { protect, admin } = require('../middleware/auth');

// ==================== DEVICE MANAGEMENT (User) ====================

// @route   GET /api/iot/devices
// @desc    Get all devices for user
// @access  Private
router.get('/devices', protect, iotController.getDevices);

// @route   POST /api/iot/devices/register
// @desc    Register/pair a device via QR code
// @access  Private
router.post('/devices/register', protect, iotController.registerDevice);

// @route   DELETE /api/iot/devices/:deviceId
// @desc    Remove a device from account
// @access  Private
router.delete('/devices/:deviceId', protect, iotController.removeDevice);

// @route   PUT /api/iot/devices/:deviceId
// @desc    Update device settings
// @access  Private
router.put('/devices/:deviceId', protect, iotController.updateDevice);

// @route   GET /api/iot/devices/:deviceId/status
// @desc    Get device status and latest data
// @access  Private
router.get('/devices/:deviceId/status', protect, iotController.getDeviceStatus);

// @route   POST /api/iot/devices/provision
// @desc    Provision a new device (admin/manufacturer)
// @access  Private (Admin)
router.post('/devices/provision', protect, admin, iotController.provisionDevice);

// ==================== DEVICE ENDPOINTS (ESP32 calls these) ====================

// @route   POST /api/iot/device/data
// @desc    Device sends sensor readings
// @access  Public (uses device credentials)
router.post('/device/data', iotController.deviceSendData);

// @route   POST /api/iot/device/heartbeat
// @desc    Device heartbeat/ping
// @access  Public (uses device credentials)
router.post('/device/heartbeat', iotController.deviceHeartbeat);

// ==================== SENSOR DATA ====================

// @route   GET /api/iot/sensors
// @desc    Get all sensor data for user
// @access  Private
router.get('/sensors', protect, iotController.getSensorData);

// @route   POST /api/iot/data
// @desc    Submit sensor reading (legacy)
// @access  Private
router.post('/data', protect, iotController.addSensorData);

// @route   GET /api/iot/history
// @desc    Get sensor data history
// @access  Private
router.get('/history', protect, iotController.getSensorHistory);

// @route   PUT /api/iot/thresholds
// @desc    Update alert thresholds
// @access  Private
router.put('/thresholds', protect, iotController.updateThresholds);

module.exports = router;
