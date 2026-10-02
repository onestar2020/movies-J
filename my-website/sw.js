// Movies-J Service Worker v2 — cache-first offline shell
// Strategy:
//   - App shell (CSS/JS/images/fonts): cache-first (versioned URLs, immutable hanggang bump)
//   - Page navigations: network-first, cache fallback + offline page hint
//   - TMDB posters: stale-while-revalidate, capped cache
//   - API/RTDB/stream embeds: HINDI ini-cache (live data at video)

const CACHE_VERSION = 'movies-j-v5';
const SHELL_CACHE = CACHE_VERSION + '-shell';
const IMG_CACHE = CACHE_VERSION + '-imgs';
const IMG_CACHE_MAX = 220; // poster cap para hindi lumaki nang walang hanggan

// App shell: pinaka-importante para gumana ang site kahit offline
const SHELL_ASSETS = [
  'index.html',
  'browse.html',
  'collection.html',
  'movie.html',
  'manifest.json',
  'images/logo-192.png',
  'images/logo-512.png',
  'images/logo-maskable.png',
  'css/theme.css?v=3',
  'css/components.css?v=8',
  'css/auth.css?v=3',
  'css/changelog.css?v=2',
  'css/pwa.css?v=2',
  'css/home.css',
  'css/movie-page.css?v=4',
  'js/firebase-config.js',
  'js/app.js?v=15',
  'js/home.js?v=9',
  'js/modern-nav.js?v=2',
  'js/watchHistory.js?v=2',
  'js/changelog.js',
  'js/servers.js?v=8',
  'js/movie.js?v=11',
  'js/auth.js?v=14',
  'js/browse.js?v=4'
];

// Install: precache the shell ( atomic-ish: hindi kailangan lahat OK para mag-install)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      Promise.allSettled(SHELL_ASSETS.map((url) => cache.add(new Request(url, { cache: 'reload' }))))
    ).then(() => self.skipWaiting())
  );
});

// Activate: purong Lumang caches + takeover agad
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Utility: trim ng image cache para may limit
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    return trimCache(cacheName, maxItems);
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 1) HINDI i-cache: live data at video sources
  if (
    url.hostname.includes('firebasedatabase.app') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com') ||
    url.hostname.includes('vidstorm') ||
    url.hostname.includes('cinesrc') ||
    url.hostname.includes('twoembed') ||
    url.hostname.includes('zxcstream') ||
    url.hostname.includes('vidlink') ||
    url.hostname.includes('dicebear') // avatars: laging fresh
  ) {
    return; // network lang, walang pasok sa SW
  }

  // 2) Page navigations: network-first, fallback sa cache, tapos offline hint
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((hit) => hit || caches.match('index.html'))
        )
    );
    return;
  }

  // 3) TMDB posters: stale-while-revalidate + trim
  if (url.hostname === 'image.tmdb.org') {
    event.respondWith(
      caches.open(IMG_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const network = fetch(req).then((res) => {
          if (res && res.ok) {
            cache.put(req, res.clone());
            trimCache(IMG_CACHE, IMG_CACHE_MAX);
          }
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // 4) Font Awesome CSS: cache-first (big file, bihirang magbago)
  if (url.hostname === 'cdnjs.cloudflare.com') {
    event.respondWith(
      caches.match(req).then((hit) =>
        hit ||
        fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put(req, copy));
          return res;
        })
      )
    );
    return;
  }

  // 5) Same-origin shell assets (CSS/JS/images): cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res && res.ok && (url.pathname.endsWith('.css') || url.pathname.endsWith('.js') || url.pathname.endsWith('.png') || url.pathname.endsWith('.jpg') || url.pathname.endsWith('.svg') || url.pathname.endsWith('.json'))) {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
      )
    );
  }
});
