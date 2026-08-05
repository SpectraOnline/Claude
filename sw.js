// Minimal offline app-shell cache. No content is fetched remotely except
// the Jost font; everything else needed to view the trip is bundled locally.
//
// Network-first: always serve the latest deploy when there's a connection,
// so updates show up immediately instead of one reload behind. Cache is
// only used as a fallback when there's genuinely no network (offline use
// while travelling), not as the default source.
const CACHE = "taylor-usa-2026-v2";
const SHELL = [
  "./",
  "index.html",
  "css/style.css",
  "js/data.js",
  "js/app.js",
  "manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
