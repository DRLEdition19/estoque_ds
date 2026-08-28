const CACHE_NAME = 'estoque-inventario-v2';
const CACHE_URLS = [
  './',
  './index.html',
  './manifest.json'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  console.log('🔧 Service Worker instalado');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('💾 Cache criado');
        return cache.addAll(CACHE_URLS);
      })
      .catch(error => console.log('❌ Erro ao criar cache:', error))
  );
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
  console.log('✅ Service Worker ativado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deletando cache antigo:', cacheName);
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
  // Ignorar requisições não-GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar requisições de navegação para iframes externos (Google Apps)
  if (event.request.mode === 'navigate' && event.request.url.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Se a resposta for válida, armazenar em cache
        if (response && response.status === 200 && response.type !== 'error') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            })
            .catch(error => console.log('Erro ao cachear:', error));
        }
        return response;
      })
      .catch(() => {
        // Se falhar, tentar do cache
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            
            // Fallback para página inicial se for navegação
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
            
            // Retornar uma resposta offline para recursos
            return new Response('Você está offline. Alguns recursos podem não estar disponíveis.', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Ouvir mensagens do cliente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
