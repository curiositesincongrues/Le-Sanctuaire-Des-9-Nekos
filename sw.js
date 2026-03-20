/* ============================================
   SERVICE WORKER — Cache PWA
   Le Sanctuaire des 9 Nekos Sacrés
   ============================================ */

const CACHE_NAME = 'neko-sanctuaire-v4-texts';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/base.css',
    '/css/cinematics.css',
    '/css/game.css',
    '/js/data.js',
    '/js/audio.js',
    '/js/renderer.js',
    '/js/cinematics.js',
    '/js/game.js',
    '/js/texts.js',
    '/js/debug.js',
    '/texts.json',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

// Fonts externes à cacher au premier chargement
const FONT_URLS = [
    'https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap',
    'https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap'
];

// Installation — pré-cache des assets locaux
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[SW] Pré-cache des assets');
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

// Activation — nettoyage des anciens caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(names =>
            Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
        ).then(() => self.clients.claim())
    );
});

// Fetch — cache-first pour les assets locaux, network-first pour les CDN
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Assets locaux → cache-first
    if (url.origin === location.origin) {
        event.respondWith(
            caches.match(event.request).then(cached => {
                if (cached) return cached;
                return fetch(event.request).then(response => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    }
                    return response;
                }).catch(() => cached);
            })
        );
        return;
    }
    
    // Fonts Google + CDN → network-first, cache en fallback
    if (url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com') || 
        url.hostname.includes('cdnjs.cloudflare.com') || url.hostname.includes('unpkg.com') ||
        url.hostname.includes('cdn.jsdelivr.net')) {
        event.respondWith(
            fetch(event.request).then(response => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => caches.match(event.request))
        );
        return;
    }
});
