/* ============================================
   SERVICE WORKER — Cache PWA
   Le Sanctuaire des 9 Nekos Sacrés
   ============================================ */

const IS_LOCALHOST =
  self.location.hostname === 'localhost' ||
  self.location.hostname === '127.0.0.1';

const CACHE_NAME = 'neko-sanctuaire-v11-shell';

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

// ===============================
// MODE DEV LOCALHOST
// ===============================
// En local : pas de cache, pas de galère.
// On laisse tout passer au réseau.
if (IS_LOCALHOST) {
  self.addEventListener('install', event => {
    event.waitUntil(self.skipWaiting());
  });

  self.addEventListener('activate', event => {
    event.waitUntil(
      caches.keys().then(names => Promise.all(names.map(name => caches.delete(name))))
        .then(() => self.clients.claim())
    );
  });

  self.addEventListener('fetch', event => {
    event.respondWith(fetch(event.request));
  });

} else {
  // ===============================
  // MODE PROD
  // ===============================

  self.addEventListener('install', event => {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then(cache => {
          console.log('[SW] Pré-cache des assets');
          return cache.addAll(ASSETS_TO_CACHE);
        })
        .then(() => self.skipWaiting())
    );
  });

  self.addEventListener('activate', event => {
    event.waitUntil(
      caches.keys().then(names =>
        Promise.all(
          names
            .filter(name => name !== CACHE_NAME)
            .map(name => caches.delete(name))
        )
      ).then(() => self.clients.claim())
    );
  });

  self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    if (url.origin === self.location.origin) {
      const isHTML =
        event.request.mode === 'navigate' ||
        url.pathname === '/' ||
        url.pathname.endsWith('.html');

      const isJSorCSS =
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.css');

      const isAudio =
        url.pathname.endsWith('.mp3');

      // HTML / JS / CSS / MP3 = network-first
      // pour éviter les vieux fichiers qui collent
      if (isHTML || isJSorCSS || isAudio) {
        event.respondWith(
          fetch(event.request)
            .then(response => {
              if (response && response.ok) {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
              }
              return response;
            })
            .catch(() => caches.match(event.request))
        );
        return;
      }

      // Le reste = cache-first
      event.respondWith(
        caches.match(event.request).then(cached => {
          if (cached) return cached;

          return fetch(event.request).then(response => {
            if (response && response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
            }
            return response;
          });
        })
      );
      return;
    }

    // CDN / fonts = network-first
    if (
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('gstatic.com') ||
      url.hostname.includes('cdnjs.cloudflare.com') ||
      url.hostname.includes('unpkg.com') ||
      url.hostname.includes('cdn.jsdelivr.net')
    ) {
      event.respondWith(
        fetch(event.request)
          .then(response => {
            if (response && response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => caches.match(event.request))
      );
    }
  });
}
