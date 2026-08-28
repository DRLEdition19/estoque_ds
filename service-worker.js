const CACHE_NAME = 'estoque-inventario-v5';
const ASSET_CACHE = 'estoque-assets-v5';
const API_CACHE = 'estoque-api-v5';

// Apenas arquivos locais aqui para evitar falha de CORS no Install
const STATIC_ASSETS = [
  '/estoque_ds/',
  '/estoque_ds/index.html',
  '/estoque_ds/manifest.json'
];

self.addEventListener('install', event => {
  console.log('🔧 Service Worker instalado - v5');
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('💾 Cache criado');
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('activate', event => {
  console.log('✅ Service Worker ativado');
  event.waitUntil(
    caches.keys().then(names => {
      return Promise.all(
        names.map(name => {
          if (![CACHE_NAME, ASSET_CACHE, API_CACHE].includes(name)) {
            console.log('🗑️ Cache antigo deletado:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  event.respondWith(
    fetch(request).then(response => {
      // Clona e salva em cache qualquer resposta válida ou "opaca" (requisições de outras origens como a imagem do GitHub)
      if (response && (response.status === 200 || response.type === 'opaque')) {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
      }
      return response;
    }).catch(() => {
      return caches.match(request).then(cached => {
        return cached || new Response('Offline', { status: 503 });
      });
    })
  );
});
