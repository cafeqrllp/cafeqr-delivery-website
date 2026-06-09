/**
 * firebase-messaging-sw.js
 * Firebase Cloud Messaging Service Worker — handles BACKGROUND push messages
 * (when the browser tab is closed or in background).
 *
 * This file MUST be served from the root of the domain:
 *   https://delivery.cafeqr.in/firebase-messaging-sw.js
 * Place it in /public/ in Next.js — Next.js serves /public as the root.
 *
 * For FOREGROUND messages (app tab is open), see lib/fcmClient.js → onForegroundMessage()
 */

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// Firebase config — must match NEXT_PUBLIC_FIREBASE_* vars
// These values are safe to hardcode here (public config)
firebase.initializeApp({
  apiKey:            self.FIREBASE_API_KEY            || '',
  authDomain:        self.FIREBASE_AUTH_DOMAIN        || '',
  projectId:         self.FIREBASE_PROJECT_ID        || '',
  storageBucket:     self.FIREBASE_STORAGE_BUCKET    || '',
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             self.FIREBASE_APP_ID            || '',
});

/**
 * NOTE: Service workers cannot read Next.js env vars (NEXT_PUBLIC_*).
 * You have two options:
 *
 * Option A (simple): hardcode the Firebase config directly in this file.
 *   Replace the self.FIREBASE_* references above with your actual values.
 *   This is safe — Firebase client config is designed to be public.
 *
 * Option B (dynamic): use next-pwa or a custom build step to inject env vars
 *   into this file at build time.
 *
 * Recommended for production: Option A with actual values.
 */

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw] Background message received:', payload);

  const { title, body, icon } = payload.notification || {};
  const notificationTitle = title || 'CafeQR';
  const notificationOptions = {
    body:  body  || 'You have a new notification',
    icon:  icon  || '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag:   payload.data?.orderId || 'cafeqr-notification',
    data:  payload.data || {},
    actions: [
      { action: 'view', title: 'View Order' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action  = event.action;
  const orderId = event.notification.data?.orderId;

  if (action === 'dismiss') return;

  // Open the order tracking page
  const url = orderId
    ? `/order-tracking?id=${orderId}`
    : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if open
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new tab
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
