const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// You need to download your service account key from Firebase Console
// Project Settings > Service Accounts > Generate New Private Key

let firebaseApp;

const initializeFirebase = () => {
  if (!firebaseApp) {
    try {
      // Option 1: Using service account JSON file
      if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID || 'chatbot-51fb7'
        });
      }
      // Option 2: Using environment variables for credentials
      else if (process.env.FIREBASE_PROJECT_ID) {
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
          }),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
      }
      // Option 3: Default credentials (for Google Cloud environments)
      else {
        firebaseApp = admin.initializeApp({
          projectId: 'chatbot-51fb7'
        });
      }

      console.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase Admin SDK:', error);
      throw error;
    }
  }
  return firebaseApp;
};

// Get Firebase Auth instance
const getAuth = () => {
  initializeFirebase();
  return admin.auth();
};

// Get Firebase Messaging instance for FCM
const getMessaging = () => {
  initializeFirebase();
  return admin.messaging();
};

module.exports = {
  initializeFirebase,
  getAuth,
  getMessaging,
  admin
};
