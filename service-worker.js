const CACHE_NAME = 'estoque-ds-v1';
const STATIC_ASSETS = [
  '/estoque_ds/',
  '/estoque_ds/index.html',
  '/estoque_ds/manifest.json',
  'https://raw.githubusercontent.com/DRLEdition19/estoque_ds/refs/heads/main/Logo%20DS%20com%20elipse.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;

  // Não intercepta chamadas externas do Google Script (evita problemas de carregamento no iframe)
  if (request.url.includes('script.google.com')) {
    return;
  }

  // Network first com fallback para cache
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.status === 200) {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, resClone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
