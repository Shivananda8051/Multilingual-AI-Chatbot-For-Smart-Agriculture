const Notification = require('../models/Notification');
const firebaseService = require('./firebaseService');
const User = require('../models/User');
const translationService = require('./translationService');
const { sendNotificationToUser } = require('./socketService');

class NotificationService {
  async createNotification(userId, type, title, message, data = {}) {
    try {
      const notification = await Notification.create({
        user: userId,
        type,
        title,
        message,
        data
      });

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async sendNotification(userId, type, title, message, data = {}) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      // Translate title and message if user's language is not English
      const userLang = user.preferredLanguage || 'en';
      let translatedTitle = title;
      let translatedMessage = message;

      if (userLang !== 'en') {
        const titleTranslation = await translationService.translateFromEnglish(title, userLang);
        translatedTitle = titleTranslation.translatedText;

        const messageTranslation = await translationService.translateFromEnglish(message, userLang);
        translatedMessage = messageTranslation.translatedText;
      }

      // Create in-app notification with both original and translated content
      const notification = await this.createNotification(userId, type, translatedTitle, translatedMessage, {
        ...data,
        originalTitle: title,
        originalMessage: message
      });

      // Send real-time notification via Socket.IO (instant)
      try {
        sendNotificationToUser(userId.toString(), {
          _id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          isRead: false,
          createdAt: notification.createdAt
        });
      } catch (socketError) {
        console.error('Socket notification failed:', socketError.message);
      }

      // Send push notification via FCM if enabled and FCM token exists
      if (user.notificationSettings?.push !== false && user.fcmToken) {
        try {
          await firebaseService.sendPushNotification(
            user.fcmToken,
            translatedTitle,
            translatedMessage,
            { type, notificationId: notification._id.toString(), ...data }
          );
          notification.isSent = true;
          notification.sentVia = 'both';
          await notification.save();
        } catch (pushError) {
          console.error('Push notification failed:', pushError);
          notification.sentVia = 'inApp';
          await notification.save();
        }
      } else {
        notification.sentVia = 'inApp';
        await notification.save();
      }

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  async sendWeatherAlert(userId, weatherData) {
    return this.sendNotification(
      userId,
      'weather',
      'Weather Alert',
      `${weatherData.condition}: ${weatherData.temp}°C expected. ${weatherData.advice || ''}`,
      weatherData
    );
  }

  async sendIoTAlert(userId, sensorData) {
    const message = `${sensorData.sensorType} reading ${sensorData.status}: ${sensorData.value}${sensorData.unit}`;
    return this.sendNotification(
      userId,
      'iot_alert',
      'Sensor Alert',
      message,
      sensorData
    );
  }

  async sendFollowNotification(userId, followerId) {
    const follower = await User.findById(followerId);
    return this.sendNotification(
      userId,
      'follow',
      'New Follower',
      `${follower.name || 'A farmer'} started following you`,
      { followerId }
    );
  }

  async sendLikeNotification(userId, postId, likerId) {
    const liker = await User.findById(likerId);
    return this.sendNotification(
      userId,
      'like',
      'Post Liked',
      `${liker.name || 'Someone'} liked your post`,
      { postId, likerId }
    );
  }

  async sendCommentNotification(userId, postId, commenterId, comment) {
    const commenter = await User.findById(commenterId);
    return this.sendNotification(
      userId,
      'comment',
      'New Comment',
      `${commenter.name || 'Someone'} commented: "${comment.substring(0, 50)}..."`,
      { postId, commenterId }
    );
  }

  async getUserNotifications(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments({ user: userId });
    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    };
  }

  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true },
      { new: true }
    );
    return notification;
  }

  async markAllAsRead(userId) {
    await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true }
    );
  }

  // Send notification to all users subscribed to a topic
  async sendTopicNotification(topic, title, message, data = {}) {
    try {
      await firebaseService.sendTopicNotification(topic, title, message, data);
      return { success: true };
    } catch (error) {
      console.error('Error sending topic notification:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
