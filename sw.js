const CACHE_NAME = 'adria-cross-v4';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/contact.html',
    '/intake-form.html',
    '/services.html',
    '/about.html',
    '/blog.html',
    '/blog/index.html',
    '/css/landing.min.css',
    '/js/main.min.js',
    '/images/icon-152x152.png',
    '/images/adria-stylist.webp',
    // Add other critical assets here
];

// Install Event: Cache core assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch Event: Serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) return;

    // For API requests, strictly use network first (never cache appointments/intake logic)
    if (event.request.url.includes('/api/')) {
        return;
    }

    const acceptHeader = event.request.headers.get('accept') || '';
    const isHtmlRequest = event.request.mode === 'navigate' || acceptHeader.includes('text/html');

    // Network-first for HTML so content updates (like new blog posts) are visible immediately.
    if (isHtmlRequest) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response && response.status === 200 && response.type === 'basic') {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
                    }
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Cache-first for static assets
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) return response;

            return fetch(event.request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
                return networkResponse;
            });
        })
    );
});
