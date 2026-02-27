const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Admin
router.get('/stats', protect, admin, adminController.getStats);

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', protect, admin, adminController.getUsers);

// @route   GET /api/admin/geography
// @desc    Get user geography data
// @access  Admin
router.get('/geography', protect, admin, adminController.getGeography);

// @route   GET /api/admin/analytics
// @desc    Get usage analytics
// @access  Admin
router.get('/analytics', protect, admin, adminController.getAnalytics);

// @route   GET /api/admin/activity
// @desc    Get real-time activity feed
// @access  Admin
router.get('/activity', protect, admin, adminController.getActivity);

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Admin
router.delete('/users/:id', protect, admin, adminController.deleteUser);

// @route   GET /api/admin/shorts-analytics
// @desc    Get shorts/reels analytics
// @access  Admin
router.get('/shorts-analytics', protect, admin, adminController.getShortsAnalytics);

// @route   GET /api/admin/location-analytics
// @desc    Get detailed location analytics
// @access  Admin
router.get('/location-analytics', protect, admin, adminController.getLocationAnalytics);

module.exports = router;
