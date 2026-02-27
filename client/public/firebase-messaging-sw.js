// Firebase Messaging Service Worker for Push Notifications
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyDs8a0Su1sG2vwa4JZU0kyGuJ_oFmC4fzY",
  authDomain: "agribot-7c183.firebaseapp.com",
  projectId: "agribot-7c183",
  storageBucket: "agribot-7c183.firebasestorage.app",
  messagingSenderId: "300316900940",
  appId: "1:300316900940:web:d6b7d7b88f917066357ee9",
  measurementId: "G-RME47XGSQY"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'Smart Agriculture';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: payload.data?.type || 'default',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  // Navigate to appropriate page based on notification type
  const data = event.notification.data;
  let url = '/';

  if (data) {
    switch (data.type) {
      case 'weather':
        url = '/weather';
        break;
      case 'iot_alert':
        url = '/iot';
        break;
      case 'follow':
      case 'like':
      case 'comment':
        url = '/community';
        break;
      case 'news':
        url = '/news';
        break;
      default:
        url = '/notifications';
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
