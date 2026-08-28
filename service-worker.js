const CACHE_NAME = 'estoque-inventario-v4';
const ASSET_CACHE = 'estoque-assets-v4';
const API_CACHE = 'estoque-api-v4';

const BASE_PATH = new URL('./', self.location.href).pathname;
const INDEX_URL = new URL('./index.html', self.location.href).href;

const STATIC_ASSETS = [
  INDEX_URL,
  new URL('./manifest.json', self.location.href).href
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names
          .filter(name => ![CACHE_NAME, ASSET_CACHE, API_CACHE].includes(name))
          .map(name => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Google Apps Script: rede primeiro; cache somente como fallback.
  if (url.origin === 'https://script.google.com') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.ok) {
            caches.open(API_CACHE).then(cache => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then(
            cached => cached || new Response('Indisponível offline', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            })
          )
        )
    );
    return;
  }

  // Navegação: rede primeiro, página em cache como fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.ok) {
            caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(() =>
          caches.match(request)
            .then(cached => cached || caches.match(INDEX_URL))
            .then(response =>
              response || new Response('Offline', {
                status: 503,
                headers: { 'Content-Type': 'text/plain; charset=utf-8' }
              })
            )
        )
    );
    return;
  }

  // Arquivos estáticos: cache primeiro + atualização em segundo plano.
  if (['style', 'script', 'image', 'font'].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then(cached => {
        const network = fetch(request)
          .then(response => {
            if (response && response.ok) {
              caches.open(ASSET_CACHE).then(cache => cache.put(request, response.clone()));
            }
            return response;
          })
          .catch(() => cached);

        return cached || network;
      })
    );
    return;
  }

  // Demais recursos.
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.ok) {
          caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
