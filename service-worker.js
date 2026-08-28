const CACHE_NAME = 'estoque-inventario-v3';
const ASSET_CACHE = 'estoque-assets-v3';
const API_CACHE = 'estoque-api-v3';

const STATIC_ASSETS = [
  '/estoque_ds/',
  '/estoque_ds/index.html',
  '/estoque_ds/manifest.json'
];

// ============================================
// 🔧 INSTALAÇÃO
// ============================================
self.addEventListener('install', event => {
  console.log('🔧 Service Worker instalado - v3');
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME)
        .then(cache => {
          console.log('💾 Cache criado');
          return cache.addAll(STATIC_ASSETS)
            .catch(() => console.log('⚠️ Alguns assets não foram cacheados'));
        }),
      caches.open(ASSET_CACHE),
      caches.open(API_CACHE)
    ])
    .then(() => {
      console.log('✅ Todos os caches configurados');
      return self.skipWaiting();
    })
  );
});

// ============================================
// ✅ ATIVAÇÃO
// ============================================
self.addEventListener('activate', event => {
  console.log('✅ Service Worker ativado');
  
  event.waitUntil(
    caches.keys()
      .then(names => {
        return Promise.all(
          names.map(name => {
            if (![CACHE_NAME, ASSET_CACHE, API_CACHE].includes(name)) {
              console.log('🗑️ Cache antigo deletado:', name);
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// ============================================
// 🌐 FETCH
// ============================================
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  if (request.method !== 'GET') return;
  
  // Google Apps - network only
  if (url.origin === 'https://script.google.com') {
    return event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            caches.open(API_CACHE).then(c => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then(c => c || new Response('Indisponível offline', { status: 503 }));
        })
    );
  }
  
  // Assets - cache first
  if (['style', 'script', 'image', 'font'].includes(request.destination)) {
    return event.respondWith(
      caches.match(request)
        .then(cached => {
          if (cached) {
            fetch(request).then(r => {
              if (r.status === 200) {
                caches.open(ASSET_CACHE).then(c => c.put(request, r));
              }
            }).catch(() => {});
            return cached;
          }
          
          return fetch(request)
            .then(response => {
              if (response && response.status === 200) {
                caches.open(ASSET_CACHE).then(c => c.put(request, response.clone()));
              }
              return response;
            });
        })
        .catch(() => new Response('', { status: 503 }))
    );
  }
  
  // Navegação - network first
  if (request.mode === 'navigate') {
    return event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then(c => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then(c => c || caches.match('/estoque_ds/index.html')
              .then(html => html || new Response('Offline', { status: 503 }))
            );
        })
    );
  }
  
  // Padrão - network first
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.status === 200) {
          caches.open(CACHE_NAME).then(c => c.put(request, response.clone()));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request)
          .then(c => c || new Response('', { status: 503 }));
      })
  );
});

// ============================================
// 💬 MENSAGENS
// ============================================
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('✅ Service Worker v3 pronto');
