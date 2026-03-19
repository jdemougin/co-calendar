const CACHE_NAME = 'co-calendar-v3';
const STATIC_ASSETS = ['/manifest.json', '/icon-192.png', '/icon-512.png'];

// Installation : cache uniquement les assets statiques (pas index.html)
self.addEventListener('install', (event) => {
  self.skipWaiting(); // active immédiatement sans attendre la fermeture de l'ancien SW
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

// Activation : supprime les anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim()) // prend le contrôle immédiatement
  );
});

// Fetch : réseau en priorité pour HTML, cache en fallback pour les assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Pour les navigations (HTML), toujours aller sur le réseau
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Pour les assets statiques : cache d'abord, réseau en fallback
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

// Notifications push
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : { title: 'co-calendar', body: 'Valide ta journée !' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
