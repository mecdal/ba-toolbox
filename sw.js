/**
 * BA Toolbox — Service Worker
 *
 * Strategy:
 *  - Precache the app shell (HTML/CSS/JS/manifest) on install so the site works offline.
 *  - Same-origin GETs: cache-first with background revalidation (stale-while-revalidate).
 *  - Cross-origin (CDN: bpmn-js, js-yaml, TinyURL/is.gd APIs): network-only — never cached,
 *    so URL shortening and live API calls always go through.
 *  - Bump CACHE_VERSION when shipping new app shell assets to invalidate old caches.
 */

const CACHE_VERSION = 'ba-toolbox-v1';
const APP_SHELL = [
  './',
  './index.html',
  './app.js',
  './style.css',
  './manifest.webmanifest',
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
