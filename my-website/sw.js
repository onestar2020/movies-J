// ✅ sw.js - Service Worker for Movies-J
const CACHE_VERSION = 'v1.2.2'; // 🔁 Increment this to trigger updates
const CACHE_NAME = `movie-cache-${CACHE_VERSION}`;

const urlsToCache = [
  './',
  './index.html',
  './css/home.css',
  './css/trailerModal.css',
  './js/home.js',
  './js/uploads.js',
  './js/watchHistory.js',
  './js/embed.js',
  './js/servers.js',
  './images/logo.png',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// ✅ Install: Pre-cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching app shell...');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting(); // Activate immediately
});

// ✅ Activate: Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim(); // Take control immediately
});

// ✅ Fetch: Cache-first for same-origin, bypass external domains
self.addEventListener('fetch', event => {
  const request = event.request;
  const requestURL = new URL(request.url);

  // Only handle same-origin requests
  if (requestURL.origin === location.origin) {
    if (request.mode === 'navigate') {
      event.respondWith(
        fetch(request).catch(() => caches.match('./index.html'))
      );
    } else {
      event.respondWith(
        caches.match(request).then(cachedResponse => {
          return cachedResponse || fetch(request);
        })
      );
    }
  } else {
    // 🔕 Skip external requests (like Google ads/CSP)
    return;
  }
});
