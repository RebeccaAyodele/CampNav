/**
 * Service Worker
 *
 * Purpose:
 *   - Intercept network requests and serve cached responses
 *   - Cache offline pages and assets
 *   - Handle sync for queued submissions
 *   - Manage offline state
 *
 * Strategy:
 *   - Cache-first for static assets (CSS, JS, fonts)
 *   - Network-first for API calls (with cache fallback)
 *   - Stale-while-revalidate for HTML pages
 */

const CACHE_VERSION = "v2";
const CACHE_NAME = `campnav-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  "/",
  "/offline",
  "/app",
  "/app/emergency",
  "/app/report",
  "/favicon.ico",
];

const RUNTIME_CACHE = "campnav-runtime";
const API_CACHE = "campnav-api";

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching static assets");
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== CACHE_NAME &&
            cacheName !== RUNTIME_CACHE &&
            cacheName !== API_CACHE
          ) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle GET requests only
  if (request.method !== "GET") {
    return;
  }

  // Never intercept Next.js framework assets or development internals.
  // These files are versioned by Next and stale cached copies break CSS/JS loading.
  if (
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/__nextjs") ||
    url.pathname.includes("webpack-hmr")
  ) {
    return;
  }

  // Skip cross-origin requests unless they are map tiles or fonts
  if (url.origin !== location.origin) {
    const isMapTile = url.hostname.includes("tile.openstreetmap.org") || url.hostname.includes("openstreetmap.org");
    const isFontOrStyle = url.hostname.includes("fonts.googleapis.com") || url.hostname.includes("fonts.gstatic.com");
    if (isMapTile || isFontOrStyle) {
      event.respondWith(cacheFirstStrategy(request));
    }
    return;
  }

  // API requests - network-first
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Static assets - cache-first
  event.respondWith(cacheFirstStrategy(request));
});

/**
 * Cache-first strategy: return cached response if available, otherwise fetch from network
 */
async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    // Support caching opaque (status 0) cross-origin assets like map tiles
    if (response.ok || response.status === 0) {
      const responseToCache = response.clone();
      cache.put(request, responseToCache);
    }
    return response;
  } catch (error) {
    console.error("Fetch failed:", error);
    // Return offline page for navigation requests
    if (request.mode === "navigate") {
      return cache.match("/offline");
    }
    throw error;
  }
}

/**
 * Network-first strategy: try to fetch from network, fallback to cache
 */
async function networkFirstStrategy(request) {
  const cache = await caches.open(API_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      const responseToCache = response.clone();
      cache.put(request, responseToCache);
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    console.error("Network request failed:", error);
    throw error;
  }
}

// Background sync for offline form submissions
self.addEventListener("sync", (event) => {
  console.log("Background sync event:", event.tag);
  // Sync logic will go here
  // event.waitUntil(syncOfflineQueue());
});

// Push notifications
self.addEventListener("push", (event) => {
  console.log("Push event received");
  // Push handling logic will go here
});

console.log("Service Worker loaded");
