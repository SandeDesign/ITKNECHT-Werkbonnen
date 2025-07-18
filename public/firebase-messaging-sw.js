// This file is intentionally empty to prevent service worker conflicts.
// Firebase Cloud Messaging functionality has been merged into service-worker.js

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

// Initialize Firebase
firebase.initializeApp({
  apiKey: "AIzaSyDWjTYxXAXkvG7F-zrhrI6JFDGCeUql0D8",
  authDomain: "it-knecht.firebaseapp.com",
  projectId: "it-knecht",
  storageBucket: "it-knecht.firebasestorage.app",
  messagingSenderId: "26567510400",
  appId: "1:26567510400:web:bdd398c4f59df9e91ad965"
});

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'IT Knecht';
  const notificationOptions = {
    body: payload.notification?.body || 'Je hebt een nieuwe melding',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: payload.data || {},
    tag: 'itknecht-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Openen'
      },
      {
        action: 'close',
        title: 'Sluiten'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click', event);
  
  event.notification.close();
  
  // Get the notification data
  const data = event.notification.data;
  const url = data?.url || '/dashboard';
  
  if (event.action === 'close') {
    // Just close the notification
    return;
  }
  
  // This looks to see if the current is already open and focuses if it is
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no matching client, open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});