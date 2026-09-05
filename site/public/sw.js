const CACHE = "env-contract-check-v2";
const SHELL = [
  "/",
  "/demo/",
  "/privacy/",
  "/terms/",
  "/404.html",
  "/mark.svg",
  "/apple-touch-icon.png",
  "/registration-press-720.webp",
  "/registration-press.webp",
  "/fonts/fraunces-latin.woff2",
  "/fonts/ibm-plex-mono-400-latin.woff2",
  "/fonts/ibm-plex-mono-600-latin.woff2"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(SHELL);
    const assets = new Set();
    for (const path of ["/", "/demo/", "/privacy/", "/terms/", "/404.html"]) {
      const response = await cache.match(path);
      const html = response ? await response.clone().text() : "";
      for (const match of html.matchAll(/["'](\/assets\/[^"']+)["']/g)) assets.add(match[1]);
    }
    await cache.addAll([...assets]);
    await self.skipWaiting();
  })());
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
