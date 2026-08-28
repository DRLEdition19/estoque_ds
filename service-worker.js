const CACHE_NAME = 'estoque-inventario-v1';
const CACHE_URLS = [
  '/estoque_ds/',
  '/estoque_ds/index.html',
  '/estoque_ds/manifest.json'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker instalado');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache criado');
        return cache.addAll(CACHE_URLS);
      })
      .catch(error => console.log('Erro ao criar cache:', error))
  );
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker ativado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia de rede: tenta rede primeiro, fallback para cache
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Se a resposta for válida, cache-la
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Se falhar, tenta do cache
        return caches.match(event.request)
          .then(response => {
            return response || caches.match('/estoque_ds/index.html');
          });
      })
  );
});
