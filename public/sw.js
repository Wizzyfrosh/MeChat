/* Only a public offline page is cached. Never cache sessions, chat, API or RSC data. */
const CACHE = "mechat-offline-v1";
const OFFLINE = "/offline.html";
self.addEventListener("install", (event) => {
 event.waitUntil(caches.open(CACHE).then((cache) => cache.add(new Request(OFFLINE, { cache: "reload" }))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
 event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("mechat-offline-") && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
 const request = event.request;
 const url = new URL(request.url);
 if (request.method !== "GET" || request.mode !== "navigate" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
 event.respondWith(fetch(request).catch(async () => (await caches.match(OFFLINE)) || Response.error()));
});
