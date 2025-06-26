const CACHE_NAME = 'movies-j-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/home.css',
  '/js/home.js',
  '/js/uploads.js',
  '/images/logo.png',
  '/about.html',
  '/contact.html',
  '/disclaimer.html'
];

// Install SW
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch from cache or network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
