// ✅ sw.js - Service Worker for Movies-J (Updated for Cache Busting)
const CACHE_VERSION = 'v1.3.5'; // 🔁 Itinaas ang version para mag-update ang cache
const CACHE_NAME = `movie-cache-${CACHE_VERSION}`;

// ✅ Idinagdag ang movie.html at movie.js para ma-cache din sila
const urlsToCache = [
  './',
  './index.html',
  './movie.html', // Dinagdag
  './css/home.css',
  './css/trailerModal.css',
  './js/home.js',
  './js/movie.js', // Dinagdag
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

// ✅ Fetch: Inayos para gumana sa versioning (?v=...)
self.addEventListener('fetch', event => {
  const request = event.request;
  const requestURL = new URL(request.url);

  // Handle same-origin requests (iyong mga file mo)
  if (requestURL.origin === location.origin) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        // Hanapin sa cache, hindi pinapansin ang query string tulad ng ?v=1.2.3
        return cache.match(request, { ignoreSearch: true }).then(cachedResponse => {
          // Kung nasa cache, ibigay ang cached version
          if (cachedResponse) {
            return cachedResponse;
          }
          // Kung wala sa cache, i-fetch sa network
          return fetch(request);
        });
      })
    );
  }
  // Para sa external requests (gaya ng TMDB, fonts, ads), hayaan lang dumaan sa network.
});