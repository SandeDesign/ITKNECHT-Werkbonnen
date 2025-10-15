// Import Workbox from CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

// Firebase Cloud Messaging imports
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

// Initialize Workbox
if (workbox) {
  console.log('Workbox loaded successfully');
  workbox.core.clientsClaim();
} else {
  console.error('Workbox failed to load');
}

// Firebase configuratie
firebase.initializeApp({
  apiKey: "AIzaSyDWjTYxXAXkvG7F-zrhrI6JFDGCeUql0D8",
  authDomain: "it-knecht.firebaseapp.com",
  projectId: "it-knecht",
  storageBucket: "it-knecht.firebasestorage.app",
  messagingSenderId: "26567510400",
  appId: "1:26567510400:web:bdd398c4f59df9e91ad965"
});

const messaging = firebase.messaging();

// Set up basic caching strategies with Workbox
if (workbox) {
  // Cache the Google Fonts stylesheets
  workbox.routing.registerRoute(
    /^https:\/\/fonts\.googleapis\.com/,
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'google-fonts-stylesheets',
    })
  );

  // Cache the underlying font files
  workbox.routing.registerRoute(
    /^https:\/\/fonts\.gstatic\.com/,
    new workbox.strategies.CacheFirst({
      cacheName: 'google-fonts-webfonts',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxAgeSeconds: 60 * 60 * 24 * 365,
          maxEntries: 30,
        }),
      ],
    })
  );

  // Cache images
  workbox.routing.registerRoute(
    /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
    new workbox.strategies.CacheFirst({
      cacheName: 'images',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        }),
      ],
    })
  );
}

// Firebase Cloud Messaging - Achtergrond berichten afhandelen
messaging.onBackgroundMessage((payload) => {
  console.log('[service-worker.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'IT Knecht';
  const notificationBody = payload.notification?.body || payload.data?.body || 'Nieuwe notificatie';
  const notificationIcon = payload.notification?.icon || payload.data?.icon || '/icon-192.png';
  const actionUrl = payload.data?.action_url || payload.data?.url || '/dashboard';

  const notificationOptions = {
    body: notificationBody,
    icon: notificationIcon,
    badge: '/icon-192.png',
    data: {
      ...payload.data,
      url: actionUrl,
      timestamp: Date.now()
    },
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    tag: payload.data?.notification_id || `notification-${Date.now()}`
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Klik op notificatie afhandelen
self.addEventListener('notificationclick', (event) => {
  console.log('[service-worker.js] Notification click: ', event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/dashboard';
  const notificationId = event.notification.data?.notification_id;

  event.waitUntil(
    (async () => {
      try {
        const windowClients = await clients.matchAll({
          type: 'window',
          includeUncontrolled: true
        });

        const baseUrl = self.location.origin;
        const fullUrl = urlToOpen.startsWith('http') ? urlToOpen : `${baseUrl}${urlToOpen}`;

        for (const client of windowClients) {
          if (client.url === fullUrl && 'focus' in client) {
            await client.focus();

            if (notificationId) {
              client.postMessage({
                type: 'NOTIFICATION_CLICKED',
                notificationId: notificationId
              });
            }
            return;
          }
        }

        if (windowClients.length > 0) {
          const client = windowClients[0];
          await client.focus();
          await client.navigate(fullUrl);

          if (notificationId) {
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              notificationId: notificationId
            });
          }
        } else if (clients.openWindow) {
          const newClient = await clients.openWindow(fullUrl);
          if (notificationId && newClient) {
            setTimeout(() => {
              newClient.postMessage({
                type: 'NOTIFICATION_CLICKED',
                notificationId: notificationId
              });
            }, 1000);
          }
        }
      } catch (error) {
        console.error('[service-worker.js] Error handling notification click:', error);
      }
    })()
  );
});

// Push event handling voor PWA
self.addEventListener('push', (event) => {
  console.log('[service-worker.js] Push event received:', event);

  if (!event.data) {
    console.log('[service-worker.js] Push event has no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[service-worker.js] Push data:', data);

    const title = data.notification?.title || data.title || 'IT Knecht';
    const options = {
      body: data.notification?.body || data.body || '',
      icon: data.notification?.icon || data.icon || '/icon-192.png',
      badge: '/icon-192.png',
      data: {
        url: data.data?.action_url || data.action_url || '/dashboard',
        notification_id: data.data?.notification_id || data.notification_id,
        ...data.data
      },
      requireInteraction: false,
      vibrate: [200, 100, 200],
      tag: data.tag || `notification-${Date.now()}`
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('[service-worker.js] Error parsing push data:', error);

    event.waitUntil(
      self.registration.showNotification('IT Knecht', {
        body: 'Nieuwe notificatie ontvangen',
        icon: '/icon-192.png',
        badge: '/icon-192.png'
      })
    );
  }
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[service-worker.js] Notification closed:', event.notification.tag);
});

// Message event voor communicatie met client
self.addEventListener('message', (event) => {
  console.log('[service-worker.js] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});