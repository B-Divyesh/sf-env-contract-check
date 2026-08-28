const CACHE = "env-contract-check-v1";
const SHELL = [
  "/",
  "/privacy/",
  "/terms/",
  "/registration-press-720.webp",
  "/registration-press.webp",
  "/fonts/fraunces-latin.woff2",
  "/fonts/ibm-plex-mono-400-latin.woff2",
  "/fonts/ibm-plex-mono-600-latin.woff2"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
    return response;
  })));
});
