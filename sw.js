// Minimal offline app-shell cache. No content is fetched remotely except
// the Jost font; everything else needed to view the trip is bundled locally.
//
// Network-first: always serve the latest deploy when there's a connection,
// so updates show up immediately instead of one reload behind. Cache is
// only used as a fallback when there's genuinely no network (offline use
// while travelling), not as the default source.
const CACHE = "taylor-usa-2026-v7";
const SHELL = [
  "./",
  "index.html",
  "css/style.css",
  "js/data.js",
  "js/app.js",
  "manifest.webmanifest",
  "docs/austin-booking.pdf",
  "docs/houston-booking.pdf",
  "docs/miami-return-booking.pdf",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // cache.addAll() is all-or-nothing - one blocked/failed resource (e.g.
      // an access-gated asset) would otherwise fail the *entire* install,
      // silently leaving no working offline cache at all. Precache each file
      // independently instead, so one failure doesn't take down the rest.
      Promise.all(SHELL.map((url) => cache.add(url).catch(() => {})))
    )
  );
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
    // cache: "no-store" bypasses the browser's own HTTP cache too, not just
    // this service worker's Cache Storage — otherwise a fresh deploy can
    // still be masked by an ordinary disk-cached response.
    fetch(req.url, { cache: "no-store" })
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
