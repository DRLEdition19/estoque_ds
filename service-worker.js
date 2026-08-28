const CACHE_NAME = 'estoque-inventario-v3';
const ASSET_CACHE_NAME = 'estoque-assets-v3';
const API_CACHE_NAME = 'estoque-api-v3';

const STATIC_ASSETS = [
  '/estoque_ds/',
  '/estoque_ds/index.html',
  '/estoque_ds/manifest.json',
  '/estoque_ds/service-worker.js'
];

const GOOGLE_APPS_DOMAIN = 'https://script.google.com/macros/s/';
const SKIP_CACHE = [
  'https://script.google.com',
  'https://www.google.com'
];

// ============================================
// 🔧 INSTALAÇÃO DO SERVICE WORKER
// ============================================
self.addEventListener('install', event => {
  console.log('🔧 Service Worker instalado - versão v3');
  
  event.waitUntil(
    Promise.all([
      // Cache de assets estáticos
      caches.open(CACHE_NAME)
        .then(cache => {
          console.log('💾 Cache estático criado');
          return cache.addAll(STATIC_ASSETS)
            .catch(error => {
              console.warn('⚠️ Aviso ao cachear assets:', error);
              return Promise.resolve();
            });
        })
        .catch(error => {
          console.error('❌ Erro ao abrir cache:', error);
        }),
      
      // Cache para assets
      caches.open(ASSET_CACHE_NAME)
        .then(cache => {
          console.log('🖼️ Cache de assets criado');
          return Promise.resolve();
        })
    ])
    .then(() => {
      console.log('✅ Caches configurados com sucesso');
      return self.skipWaiting();
    })
    .catch(error => {
      console.error('❌ Erro fatal ao configurar caches:', error);
    })
  );
});

// ============================================
// ✅ ATIVAÇÃO DO SERVICE WORKER
// ============================================
self.addEventListener('activate', event => {
  console.log('✅ Service Worker ativado');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        console.log('Caches encontrados:', cacheNames);
        
        return Promise.all(
          cacheNames.map(cacheName => {
            const validCaches = [CACHE_NAME, ASSET_CACHE_NAME, API_CACHE_NAME];
            
            if (!validCaches.includes(cacheName)) {
              console.log('🗑️ Deletando cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Limpeza de caches concluída');
        return self.clients.claim();
      })
      .catch(error => {
        console.error('❌ Erro ao ativar:', error);
      })
  );
});

// ============================================
// 🌐 ESTRATÉGIA DE FETCH
// ============================================
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requisições não-GET
  if (request.method !== 'GET') {
    return;
  }
  
  // ========== Google Apps Script - Network Only ==========
  if (url.origin === 'https://script.google.com') {
    return event.respondWith(
      fetch(request, { 
        credentials: 'include',
        mode: 'no-cors'
      })
        .then(response => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(API_CACHE_NAME)
              .then(cache => {
                cache.put(request, responseClone);
              })
              .catch(() => {});
          }
          return response;
        })
        .catch(error => {
          console.warn('❌ Erro ao fetch Google Apps:', error);
          // Tentar cache como fallback
          return caches.match(request)
            .then(cached => {
              return cached || new Response(
                'Indisponível offline. Conecte-se à internet.',
                { status: 503 }
              );
            });
        })
    );
  }
  
  // ========== Assets (CSS, JS, Imagens) - Cache First ==========
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'image' ||
      request.destination === 'font') {
    
    return event.respondWith(
      caches.match(request)
        .then(cached => {
          if (cached) {
            // Background update
            fetch(request)
              .then(freshResponse => {
                if (freshResponse && freshResponse.status === 200) {
                  caches.open(ASSET_CACHE_NAME)
                    .then(cache => {
                      cache.put(request, freshResponse);
                    })
                    .catch(() => {});
                }
              })
              .catch(() => {});
            
            return cached;
          }
          
          // Não está em cache, buscar da rede
          return fetch(request)
            .then(response => {
              if (response && response.status === 200 && response.type !== 'error') {
                const responseToCache = response.clone();
                caches.open(ASSET_CACHE_NAME)
                  .then(cache => {
                    cache.put(request, responseToCache);
                  })
                  .catch(() => {});
              }
              return response;
            });
        })
        .catch(() => {
          // Fallback para asset offline
          if (request.destination === 'image') {
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#eee" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="#999">?</text></svg>',
              { 
                headers: { 'Content-Type': 'image/svg+xml' },
                status: 200
              }
            );
          }
          return new Response('', { status: 503 });
        })
    );
  }
  
  // ========== Navegação - Network First ==========
  if (request.mode === 'navigate') {
    return event.respondWith(
      fetch(request, { credentials: 'include' })
        .then(response => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(request, responseToCache);
              })
              .catch(() => {});
          }
          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then(cached => {
              if (cached) return cached;
              
              return caches.match('/estoque_ds/index.html')
                .then(html => {
                  return html || new Response(
                    'Página indisponível. Verifique sua conexão.',
                    { status: 503 }
                  );
                });
            });
        })
    );
  }
  
  // ========== Padrão - Network First com Cache Fallback ==========
  return event.respondWith(
    fetch(request, { credentials: 'include' })
      .then(response => {
        if (response && response.status === 200 && response.type !== 'error') {
          const responseToCache = response.clone();
          const cacheNameToUse = request.destination === '' ? CACHE_NAME : ASSET_CACHE_NAME;
          caches.open(cacheNameToUse)
            .then(cache => {
              cache.put(request, responseToCache);
            })
            .catch(() => {});
        }
        return response;
      })
      .catch(() => {
        return caches.match(request)
          .then(cached => {
            return cached || new Response(
              'Recurso indisponível offline.',
              { status: 503 }
            );
          });
      })
  );
});

// ============================================
// 💬 MENSAGENS DO CLIENTE
// ============================================
self.addEventListener('message', event => {
  console.log('📨 Mensagem recebida:', event.data?.type);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLIENTS_CLAIM') {
    self.clients.claim();
  }
  
  if (event.data && event.data.type === 'CACHE_INFO') {
    caches.keys().then(keys => {
      event.ports[0].postMessage({
        type: 'CACHE_INFO_RESPONSE',
        caches: keys
      });
    }).catch(() => {});
  }
});

// ============================================
// 📳 SINCRONIZAÇÃO EM BACKGROUND
// ============================================
self.addEventListener('sync', event => {
  if (event.tag === 'sync-updates') {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then(cache => cache.keys())
        .then(requests => {
          return Promise.all(
            requests.map(request => {
              return fetch(request, { credentials: 'include' })
                .then(response => {
                  if (response && response.status === 200) {
                    return caches.open(CACHE_NAME)
                      .then(cache => {
                        cache.put(request, response);
                      });
                  }
                })
                .catch(() => {});
            })
          );
        })
        .then(() => {
          return self.clients.matchAll();
        })
        .then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_COMPLETE',
              timestamp: new Date().toISOString()
            });
          });
        })
        .catch(error => {
          console.error('❌ Erro na sincronização:', error);
        })
    );
  }
});

// ============================================
// ⏰ PERIODIC BACKGROUND SYNC
// ============================================
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-check') {
    event.waitUntil(
      self.clients.matchAll()
        .then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'PERIODIC_UPDATE',
              timestamp: new Date().toISOString()
            });
          });
        })
        .catch(() => {})
    );
  }
});

// ============================================
// 📨 PUSH NOTIFICATIONS
// ============================================
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'Nova atualização',
    icon: data.icon || '/estoque_ds/data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%231a1a1a" width="192" height="192"/><text x="50%" y="50%" font-size="100" fill="%23fff" text-anchor="middle" dominant-baseline="central" font-family="Arial">📦</text></svg>',
    badge: '/estoque_ds/badge.png',
    tag: 'estoque-notification',
    requireInteraction: false
  };
  
  event.waitUntil(
    self.registration.showNotification('Estoque & Inventário', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then(clients => {
        for (let client of clients) {
          if (client.url === '/estoque_ds/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow('/estoque_ds/');
        }
      })
  );
});

// ============================================
// ✅ INICIALIZAÇÃO
// ============================================
console.log('✅ Service Worker v3 pronto para trabalhar');
