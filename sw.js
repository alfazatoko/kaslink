const CACHE_NAME = 'kink-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/firebase-config.js',
  '/logo.png',
  '/manifest.json'

];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
