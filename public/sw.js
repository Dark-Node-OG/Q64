// Q64 service worker — makes the game work OFFLINE (no APK needed).
// After the first online visit, the app shell, scripts, pieces and photos are cached on
// the device, so the game opens and plays with no connection. Only the online parts
// (multiplayer, accounts, LUPUS's brain) need a connection — those simply won't respond offline.

const CACHE = "q64-v1";
const PRECACHE = ["/"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // leave Supabase / Groq / other hosts alone
  if (url.pathname.startsWith("/api/")) return;     // never cache API calls

  // Page loads: try the network, fall back to the cached app shell when offline.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put("/", copy)); return res; })
        .catch(() => caches.match("/"))
    );
    return;
  }

  // Everything else (scripts, styles, pieces, legend photos, backgrounds): cache-first.
  e.respondWith(
    caches.match(req).then((cached) =>
      cached ||
      fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => cached)
    )
  );
});
