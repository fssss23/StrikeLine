/* global importScripts, firebase */
// Firebase Cloud Messaging service worker — handles web push when the app
// tab is closed or in the background (required on Android/desktop).
//
// Service workers cannot read Vite env vars, so the Firebase web config is
// inlined here. These values are the same public-safe ones as in .env —
// fill them in from Firebase Console → Project settings → Your apps.

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: 'AIzaSyCSjIktKRI73VlVrudmAD2CvAz6opHqt-E',
  authDomain: 'strikeline-ee98e.firebaseapp.com',
  projectId: 'strikeline-ee98e',
  messagingSenderId: '508897979500',
  appId: '1:508897979500:web:7168927d80a69496a0bc49',
};

// Don't initialize with placeholder values — push simply stays disabled
if (!firebaseConfig.apiKey.startsWith('REPLACE_WITH_')) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title ?? 'StrikeLine Alert';
    const options = {
      body: payload.notification?.body ?? '',
      icon: '/favicon.svg',
      data: { url: '/history' },
    };
    self.registration.showNotification(title, options);
  });

  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url ?? '/';
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        for (const client of windowClients) {
          if ('focus' in client) return client.focus();
        }
        return clients.openWindow(url);
      })
    );
  });
}
