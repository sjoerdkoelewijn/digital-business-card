const CACHE_NAME = "visitekaartje-v17";

const ASSETS = [
  "./",
  "./index.html",
  "./nfc.html",
  "./manifest.webmanifest",
  "./assets/styles.css",
  "./assets/app.js",
  "./assets/nfc.js",
  "./assets/contact-store.js",
  "./assets/icons.js",
  "./assets/qrcode.min.js",
  "./data/contact.js",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-512.png",
  "./assets/fonts/bricolage-grotesque-latin.woff2",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  // Stale-while-revalidate: answer instantly from cache (important on a
  // slow connection at a reception desk), but always refetch in the
  // background so the *next* load already has whatever changed — instead
  // of being stuck on one cached version until someone clears site data.
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        })
        .catch(() => null);
      return cached || (await network) || Response.error();
    }),
  );
});
