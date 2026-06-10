import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

let hasFirebaseConfig = true;
for (const envVar of requiredEnvVars) {
  if (!import.meta.env[envVar]) {
    hasFirebaseConfig = false;
    break;
  }
}

let messaging = null

if (hasFirebaseConfig) {
  try {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    }
    const app = initializeApp(firebaseConfig)
    messaging = getMessaging(app)
  } catch (e) {
    console.warn('Firebase init failed:', e.message)
  }
} else {
  console.warn('Firebase config missing or incomplete — push notifications disabled')
}

export const requestFirebaseToken = async () => {
  if (!messaging) return null;
  try {
    return await getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY });
  } catch (err) {
    console.warn('Failed to get FCM token:', err.message);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

export { messaging }
