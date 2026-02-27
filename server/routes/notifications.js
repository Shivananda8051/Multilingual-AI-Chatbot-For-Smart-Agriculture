const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// @route   GET /api/notifications
// @desc    Get user notifications
router.get('/', notificationController.getNotifications);

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
router.get('/unread-count', notificationController.getUnreadCount);

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
router.put('/read-all', notificationController.markAllAsRead);

// @route   DELETE /api/notifications/clear
// @desc    Clear all notifications
router.delete('/clear', notificationController.clearAllNotifications);

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
router.put('/:id/read', notificationController.markAsRead);

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
