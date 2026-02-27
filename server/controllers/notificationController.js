const notificationService = require('../services/notificationService');

// @desc    Get user notifications
// @route   GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await notificationService.getUserNotifications(
      req.user._id,
      parseInt(page),
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications'
    });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
exports.getUnreadCount = async (req, res) => {
  try {
    const result = await notificationService.getUserNotifications(req.user._id, 1, 1);
    res.status(200).json({
      success: true,
      unreadCount: result.unreadCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user._id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark as read'
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.user._id);
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark all as read'
    });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
};

exports.clearAllNotifications = async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    await Notification.deleteMany({ user: req.user._id });
    res.status(200).json({
      success: true,
      message: 'All notifications cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear notifications'
    });
  }
};
