const CACHE_NAME = 'movies-j-cache-v2';
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

// Activate SW and delete old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(name =>
          cacheWhitelist.includes(name) ? null : caches.delete(name)
        )
      )
    )
  );
});

// Fetch from cache or network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
