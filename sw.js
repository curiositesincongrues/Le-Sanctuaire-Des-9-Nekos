/* ============================================
   SERVICE WORKER — Cache PWA
   Le Sanctuaire des 9 Nekos Sacrés
   ============================================ */

const CACHE_NAME = 'neko-sanctuaire-v10-shell';
const ASSETS_TO_CACHE = [
    '/audio/voices/game_01.mp3',
    '/audio/voices/game_02.mp3',
    '/audio/voices/game_03.mp3',
    '/audio/voices/game_04.mp3',
    '/audio/voices/intro_01.mp3',
    '/audio/voices/intro_02.mp3',
    '/audio/voices/intro_03.mp3',
    '/audio/voices/intro_04.mp3',
    '/audio/voices/intro_05.mp3',
    '/audio/voices/intro_06.mp3',
    '/audio/voices/intro_07.mp3',
    '/audio/voices/intro_08.mp3',
    '/audio/voices/outro_01.mp3',
    '/audio/voices/outro_02.mp3',
    '/audio/voices/outro_03.mp3',
    '/audio/voices/outro_04.mp3',
    '/audio/voices/outro_05.mp3',
    '/audio/voices/outro_06.mp3',
    '/audio/voices/outro_07.mp3',
    '/audio/voices/outro_08.mp3',
    '/audio/voices/outro_09.mp3',
    '/audio/voices/outro_10.mp3',
    '/audio/voices/outro_11.mp3',
    '/audio/voices/var_01.mp3',
    '/audio/voices/var_02.mp3',
    '/audio/voices/var_03.mp3',
    '/audio/voices/var_04.mp3',
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
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
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
    
    // Assets locaux JS/CSS → network-first (évite cache périmé après refresh)
    // HTML + icons → cache-first (stable)
    if (url.origin === location.origin) {
        const isJSorCSS = url.pathname.endsWith('.js') || url.pathname.endsWith('.css');
        if (isJSorCSS) {
            // Network-first : toujours essayer le réseau, fallback cache
            event.respondWith(
                fetch(event.request).then(response => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    }
                    return response;
                }).catch(() => caches.match(event.request))
            );
        } else {
            // Cache-first pour HTML, images, manifest
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
        }
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
