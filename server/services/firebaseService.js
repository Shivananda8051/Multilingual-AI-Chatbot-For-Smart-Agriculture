const { getAuth, getMessaging } = require('../config/firebase');

class FirebaseService {
  // Verify Firebase ID token from client-side phone authentication
  async verifyIdToken(idToken) {
    try {
      const auth = getAuth();
      const decodedToken = await auth.verifyIdToken(idToken);
      return {
        success: true,
        uid: decodedToken.uid,
        phone: decodedToken.phone_number
      };
    } catch (error) {
      console.error('Error verifying Firebase token:', error);
      throw new Error('Invalid or expired token');
    }
  }

  // Get user by phone number
  async getUserByPhone(phoneNumber) {
    try {
      const auth = getAuth();
      const userRecord = await auth.getUserByPhoneNumber(phoneNumber);
      return userRecord;
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return null;
      }
      throw error;
    }
  }

  // Send FCM push notification to a device
  async sendPushNotification(fcmToken, title, body, data = {}) {
    try {
      const messaging = getMessaging();

      const message = {
        token: fcmToken,
        notification: {
          title,
          body
        },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        },
        webpush: {
          notification: {
            icon: '/favicon.svg',
            badge: '/favicon.svg'
          },
          fcmOptions: {
            link: data.link || '/'
          }
        }
      };

      const response = await messaging.send(message);
      console.log('FCM notification sent successfully:', response);
      return { success: true, messageId: response };
    } catch (error) {
      console.error('Error sending FCM notification:', error);
      throw new Error('Failed to send push notification');
    }
  }

  // Send notification to multiple devices
  async sendMulticastNotification(fcmTokens, title, body, data = {}) {
    try {
      const messaging = getMessaging();

      const message = {
        tokens: fcmTokens,
        notification: {
          title,
          body
        },
        data: {
          ...data
        }
      };

      const response = await messaging.sendEachForMulticast(message);
      console.log(`FCM multicast sent: ${response.successCount} success, ${response.failureCount} failed`);
      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount
      };
    } catch (error) {
      console.error('Error sending multicast notification:', error);
      throw error;
    }
  }

  // Send topic-based notification (e.g., weather alerts to all subscribed users)
  async sendTopicNotification(topic, title, body, data = {}) {
    try {
      const messaging = getMessaging();

      const message = {
        topic,
        notification: {
          title,
          body
        },
        data: {
          ...data
        }
      };

      const response = await messaging.send(message);
      console.log('Topic notification sent successfully:', response);
      return { success: true, messageId: response };
    } catch (error) {
      console.error('Error sending topic notification:', error);
      throw error;
    }
  }

  // Subscribe user to a topic
  async subscribeToTopic(fcmToken, topic) {
    try {
      const messaging = getMessaging();
      await messaging.subscribeToTopic(fcmToken, topic);
      return { success: true };
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      throw error;
    }
  }

  // Unsubscribe user from a topic
  async unsubscribeFromTopic(fcmToken, topic) {
    try {
      const messaging = getMessaging();
      await messaging.unsubscribeFromTopic(fcmToken, topic);
      return { success: true };
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
      throw error;
    }
  }

  // Send weather alert notification
  async sendWeatherAlert(fcmToken, weatherData) {
    const title = 'Weather Alert';
    const body = `${weatherData.alert}. Current: ${weatherData.temp}°C, ${weatherData.condition}. Plan your farming activities accordingly.`;
    return this.sendPushNotification(fcmToken, title, body, { type: 'weather', ...weatherData });
  }

  // Send news alert notification
  async sendNewsAlert(fcmToken, newsTitle) {
    const title = 'Agriculture News';
    const body = `${newsTitle}. Open the app for more details.`;
    return this.sendPushNotification(fcmToken, title, body, { type: 'news' });
  }

  // Send IoT sensor alert
  async sendIoTAlert(fcmToken, sensorData) {
    const title = 'Sensor Alert';
    const body = `${sensorData.sensorType} reading ${sensorData.status}: ${sensorData.value}${sensorData.unit}`;
    return this.sendPushNotification(fcmToken, title, body, { type: 'iot_alert', ...sensorData });
  }
}

module.exports = new FirebaseService();
