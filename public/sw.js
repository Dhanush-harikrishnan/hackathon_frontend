// SafeRoute Service Worker - Offline-First for Disaster Resilience
// This service worker caches essential files so the app works without internet
// Perfect for disaster scenarios when network infrastructure is down

const CACHE_NAME = 'saferoute-v1';

// Core files to cache for offline use
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json'
];

// Install: Cache static assets immediately
self.addEventListener('install', (event) => {
    console.log('⚡ Service Worker: Installing for offline support');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('📦 Caching app shell for disaster-mode offline access');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    // Activate immediately without waiting
    self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker: Activated - Offline mode ready');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    // Take control of all pages immediately
    self.clients.claim();
});

// Fetch: Network-first, fallback to cache (stale-while-revalidate)
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip API calls - let the app handle those with localStorage
    if (event.request.url.includes('/api/')) return;

    event.respondWith(
        // Try network first
        fetch(event.request)
            .then((response) => {
                // Clone and cache the response
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // Network failed - serve from cache (offline mode)
                console.log('📡 Offline: Serving from cache:', event.request.url);
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // If no cache, return the main page for SPA routing
                    if (event.request.mode === 'navigate') {
                        return caches.match('/index.html');
                    }
                    return new Response('Offline - Resource not cached', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                });
            })
    );
});

// Listen for messages from the app
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});
