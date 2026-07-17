const CACHE_NAME = "opshub-v6";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.json",
  "./js/app.js",
  "./js/store.js",
  "./js/engine.js",
  "./js/views/dashboard.js",
  "./js/views/assets.js",
  "./js/views/projects.js",
  "./js/views/tasks.js",
  "./js/views/calendar.js",
  "./js/views/analytics.js",
  "./js/views/settings.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// Install Event - Pre-cache resources
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("[Service Worker] Pre-caching offline assets");
      return cache.addAll(ASSETS).catch(err => {
        console.warn("[Service Worker] Caching warning (some files might be missing initially):", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Serve from Cache, Fallback to Network
self.addEventListener("fetch", event => {
  // Only handle HTTP/S requests (avoid chrome-extension issues)
  if (!event.request.url.startsWith(self.location.origin) && !event.request.url.startsWith("http")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Fetch fresh in background to update cache (stale-while-revalidate)
        fetch(event.request)
          .then(networkResponse => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {/* Ignore background sync failures */});
        
        return cachedResponse;
      }

      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
          return networkResponse;
        }

        // Put search parameters/analytics external calls aside, cache basic local routes
        const responseToCache = networkResponse.clone();
        const url = new URL(event.request.url);
        const path = url.pathname;
        const isStatic = ASSETS.some(asset => {
          const resolved = asset.replace("./", "/");
          return path === resolved || path === resolved + "index.html";
        }) || path.endsWith(".html") || path.endsWith(".css") || path.endsWith(".js") || path.endsWith(".png") || path.endsWith(".json");

        if (isStatic && event.request.url.startsWith(self.location.origin)) {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for document navigation if completely offline
        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }
      });
    })
  );
});
