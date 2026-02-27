import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDs8a0Su1sG2vwa4JZU0kyGuJ_oFmC4fzY",
  authDomain: "agribot-7c183.firebaseapp.com",
  projectId: "agribot-7c183",
  storageBucket: "agribot-7c183.firebasestorage.app",
  messagingSenderId: "300316900940",
  appId: "1:300316900940:web:d6b7d7b88f917066357ee9",
  measurementId: "G-RME47XGSQY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Firebase Cloud Messaging (only in browser with service worker support)
let messaging = null;
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.error('Firebase messaging not supported:', error);
  }
}

// Setup reCAPTCHA verifier for phone authentication
export const setupRecaptcha = (containerId) => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        // Reset reCAPTCHA
        window.recaptchaVerifier = null;
      }
    });
  }
  return window.recaptchaVerifier;
};

// Send OTP to phone number
export const sendOTP = async (phoneNumber) => {
  try {
    const recaptchaVerifier = setupRecaptcha('recaptcha-container');
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
    window.confirmationResult = confirmationResult;

    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('Error sending OTP:', error);
    // Reset reCAPTCHA on error
    window.recaptchaVerifier = null;
    throw new Error(error.message || 'Failed to send OTP');
  }
};

// Verify OTP
export const verifyOTP = async (otp) => {
  try {
    if (!window.confirmationResult) {
      throw new Error('Please request OTP first');
    }

    const result = await window.confirmationResult.confirm(otp);
    const user = result.user;

    // Get the ID token to send to backend
    const idToken = await user.getIdToken();

    return {
      success: true,
      idToken,
      phone: user.phoneNumber,
      uid: user.uid
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw new Error(error.message || 'Invalid OTP');
  }
};

// Get current user's ID token
export const getIdToken = async () => {
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken();
  }
  return null;
};

// Get FCM token for push notifications
export const getFCMToken = async () => {
  if (!messaging) {
    console.warn('Firebase messaging not available');
    throw new Error('Push notifications not supported in this browser');
  }

  // Get VAPID key from environment variable first
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  console.log('VAPID key loaded:', vapidKey ? 'Yes' : 'No');

  if (!vapidKey || vapidKey === 'your_vapid_key_here') {
    console.error('VAPID key not configured');
    throw new Error('Push notifications not configured. Please restart the app.');
  }

  // Request notification permission
  const permission = await Notification.requestPermission();
  console.log('Notification permission:', permission);

  if (permission !== 'granted') {
    throw new Error('Notification permission denied');
  }

  // In development with self-signed HTTPS, service workers may fail
  // We'll try multiple approaches
  const isDev = import.meta.env.DEV;

  try {
    let token = null;
    let swRegistration = null;

    // Try to find existing service worker first
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      swRegistration = registrations.find(r => r.active?.scriptURL?.includes('firebase-messaging'));

      // If no Firebase SW, try to register one (may fail in dev with self-signed cert)
      if (!swRegistration) {
        try {
          swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          await navigator.serviceWorker.ready;
          console.log('Service worker registered');
        } catch (swError) {
          console.warn('Service worker registration failed (expected in dev with HTTPS):', swError.message);
          // In development, we can still try to get token without SW
        }
      }
    }

    // Try to get token with service worker if available
    if (swRegistration) {
      token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: swRegistration
      });
    }

    // If no token yet, try without explicit SW (Firebase may use its own)
    if (!token) {
      try {
        token = await getToken(messaging, { vapidKey });
      } catch (e) {
        console.warn('getToken without SW failed:', e.message);
      }
    }

    console.log('FCM token obtained:', token ? 'Yes (length: ' + token.length + ')' : 'No');

    if (!token) {
      if (isDev) {
        throw new Error('Push notifications require HTTP (not HTTPS) in development. Try running without SSL or in production mode.');
      }
      throw new Error('Failed to get push notification token. Try refreshing the page.');
    }

    return token;
  } catch (tokenError) {
    console.error('Error getting FCM token:', tokenError);
    throw new Error(tokenError.message || 'Failed to register for push notifications');
  }
};

// Listen for foreground messages
export const onForegroundMessage = (callback) => {
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    callback(payload);
  });
};

// Sign out
export const signOut = async () => {
  try {
    await auth.signOut();
    window.confirmationResult = null;
    window.recaptchaVerifier = null;
  } catch (error) {
    console.error('Error signing out:', error);
  }
};

export { auth, messaging };
export default app;
