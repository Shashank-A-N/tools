// =============================================
//  ShadowTools Service Worker v3.0
//  Premium PWA with smart caching & offline
// =============================================

const CACHE_VERSION = 'shadowtools-v3';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// Core shell to pre-cache (keeps the app working offline)
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './styles.css',
  './script.js',
  './shared/theme.js',
  './shared/theme.css',
  './shared/auth.js',
  './shared/auth.css',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './logo-final.png'
];

// Install — pre-cache static shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Pre-caching app shell...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate — clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map(key => {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim()) // Take control immediately
  );
});

// Fetch — stale-while-revalidate for HTML, cache-first for assets
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and external requests
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // HTML pages — network first, fall back to cache
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // Static assets — cache first, then network
  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) return cached;

        return fetch(request).then(response => {
          // Only cache successful responses from our origin
          if (response.ok && url.origin === self.location.origin) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        });
      })
      .catch(() => {
        // Offline fallback for images
        if (request.url.match(/\.(png|jpg|jpeg|webp|svg|gif)$/)) {
          return new Response(
            `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#0f172a" width="200" height="200"/><text fill="#8b5cf6" font-family="sans-serif" font-size="14" x="50%" y="50%" text-anchor="middle" dy=".35em">Offline</text></svg>`,
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }
      })
  );
});
