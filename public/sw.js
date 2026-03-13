const CACHE_NAME = 'shopping-list-pwa-v2'
const STATIC_CACHE = 'shopping-list-static-v2'

self.addEventListener('install', (event) => {
    event.waitUntil(
        // Only pre-cache the app shell HTML — not CSS/JS (content-hashed, fetched on demand)
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(['/']))
            .then(() => self.skipWaiting())
    )
})

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME && key !== STATIC_CACHE)
                    .map((key) => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    )
})

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return

    const url = new URL(event.request.url)

    // API: always network, never cache
    if (url.pathname.startsWith('/api/')) return

    // Next.js static assets (_next/static/) are content-hashed → immutable → cache-first
    if (url.pathname.startsWith('/_next/static/')) {
        event.respondWith(
            caches.open(STATIC_CACHE).then((cache) =>
                cache.match(event.request).then((cached) => {
                    if (cached) return cached
                    return fetch(event.request).then((response) => {
                        if (response.ok) cache.put(event.request, response.clone())
                        return response
                    })
                })
            )
        )
        return
    }

    // HTML navigation and other assets: network-first, fall back to cache when offline
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response.ok) {
                    const clone = response.clone()
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
                }
                return response
            })
            .catch(() => caches.match(event.request).then((cached) => cached ?? caches.match('/')))
    )
})
