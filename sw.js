/* ============================================
   SERVICE WORKER — Cache PWA stable (Sprint 1)
   ============================================ */

const CACHE_VERSION = 'v11';
const SHELL_CACHE = `neko-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `neko-runtime-${CACHE_VERSION}`;

const SHELL_ASSETS = [
    '',
    'index.html',
    'manifest.json',
    'texts.json',
    'css/base.css',
    'css/cinematics.css',
    'css/game.css',
    'js/state.js',
    'js/storage.js',
    'js/data.js',
    'js/texts.js',
    'js/audio.js',
    'js/renderer.js',
    'js/cinematics.js',
    'js/game.js',
    'js/debug.js',
    'js/app.js',
    'icons/icon-192x192.png',
    'icons/icon-512x512.png'
];

function scopeUrl(path = '') {
    return new URL(path, self.registration.scope).toString();
}

function isSameOrigin(requestUrl) {
    return new URL(requestUrl).origin === self.location.origin;
}

function isHTMLRequest(request) {
    return request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');
}

function isStaticAsset(pathname) {
    return /\.(?:js|css|json|png|jpg|jpeg|webp|svg|mp3|wav|ogg)$/i.test(pathname);
}

self.addEventListener('install', event => {
    event.waitUntil((async () => {
        const cache = await caches.open(SHELL_CACHE);
        await cache.addAll(SHELL_ASSETS.map(scopeUrl));
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        const names = await caches.keys();
        await Promise.all(
            names
                .filter(name => ![SHELL_CACHE, RUNTIME_CACHE].includes(name))
                .map(name => caches.delete(name))
        );
        await self.clients.claim();
    })());
});

async function networkFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    try {
        const response = await fetch(request);
        if (response && response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        const cached = await cache.match(request);
        if (cached) return cached;
        throw err;
    }
}

async function staleWhileRevalidate(request, cacheName, event) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    const networkPromise = fetch(request)
        .then(response => {
            if (response && response.ok) cache.put(request, response.clone());
            return response;
        })
        .catch(() => null);

    if (cached) {
        if (event && typeof event.waitUntil === 'function') event.waitUntil(networkPromise);
        return cached;
    }

    const networkResponse = await networkPromise;
    if (networkResponse) return networkResponse;
    return cache.match(request);
}

async function cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
}


self.addEventListener('fetch', event => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    if (!isSameOrigin(request.url)) return;

    if (isHTMLRequest(request)) {
        event.respondWith(networkFirst(request, SHELL_CACHE));
        return;
    }

    if (isStaticAsset(url.pathname)) {
        if (/\.(?:mp3|wav|ogg|png|jpg|jpeg|webp|svg)$/i.test(url.pathname)) {
            event.respondWith(cacheFirst(request, RUNTIME_CACHE));
            return;
        }
        event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE, event));
        return;
    }

    event.respondWith(networkFirst(request, RUNTIME_CACHE));
});
