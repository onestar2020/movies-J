const CACHE_NAME = 'movie-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './css/home.css',
  './js/home.js',
  './js/uploads.js',
  './js/watchHistory.js',
  './images/logo.png',
  './manifest.json',
];

// Install and pre-cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting(); // optional: activate immediately
});

// Activate and clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
  self.clients.claim(); // optional: take control immediately
});

// Fetch from cache or fallback to network
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(response => response || fetch(event.request))
    );
  }
});
