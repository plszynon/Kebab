// firebase-messaging-sw.js
// Ten plik MUSI być w głównym katalogu (public/) Firebase Hosting

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  authDomain:        'kebabclicker-1b327.firebaseapp.com',
  projectId:         'kebabclicker-1b327',
  storageBucket:     'kebabclicker-1b327.firebasestorage.app',
  messagingSenderId: '453751290941',
  appId:             '1:453751290941:web:0a425c23334de9f2d67e54',
});

const messaging = firebase.messaging();

// Powiadomienia gdy aplikacja jest w TLE lub ZAMKNIĘTA
messaging.onBackgroundMessage(payload => {
  console.log('[SW] Background message:', payload);
  const { title, body, icon } = payload.notification || {};
  const data = payload.data || {};

  self.registration.showNotification(title || '🌯 Kebab Clicker', {
    body:               body || '',
    icon:               icon || '/icon-192.png',
    badge:              '/icon-192.png',
    tag:                data.tag || 'kebab-fcm',
    renotify:           true,
    requireInteraction: data.requireInteraction === 'true',
    vibrate:            [400, 150, 400, 150, 400, 150, 800],
    data:               { url: data.url || '/' },
    actions: [
      { action: 'open', title: '🎮 Graj teraz' },
      { action: 'close', title: '✖ Zamknij' },
    ],
  });
});

// Kliknięcie powiadomienia → otwórz grę
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'close') return;
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes(self.location.origin) && 'focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// Cache dla PWA offline
const CACHE = 'kebab-v1';
const CACHE_FILES = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(CACHE_FILES).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
