/**
 * BA Toolbox — Service Worker
 *
 * Strategy:
 *  - Precache the minimal app shell (HTML/CSS/manifest + main entry) on install.
 *  - Same-origin GETs: stale-while-revalidate. The 30+ ES modules under src/
 *    aren't pre-listed; they're cached opportunistically on first fetch, which
 *    keeps APP_SHELL small and means new files don't need a service-worker
 *    update to be cacheable.
 *  - Cross-origin (CDN: bpmn-js, js-yaml; APIs: TinyURL/is.gd): network-only.
 *    URL shortener calls and lazy-loaded libraries always go through fresh.
 *  - Bump CACHE_VERSION when the shell layout changes (e.g. main.js path).
 *    v2 (Sprint 5a Faz 4): legacy app.js removed; main entry is src/main.js.
 */

const CACHE_VERSION = 'ba-toolbox-v2';
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './manifest.webmanifest',
  './src/main.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // Cross-origin: don't cache (BPMN CDN, YAML CDN, URL shortener APIs).
  if (!sameOrigin) return;

  // Same-origin: stale-while-revalidate.
  event.respondWith(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.match(req).then((cached) => {
        const network = fetch(req)
          .then((res) => {
            if (res && res.status === 200 && res.type === 'basic') cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached); // offline + miss → undefined response handled below
        return cached || network;
      })
    )
  );
});
