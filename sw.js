/* sw.js — Italy Embalagens ERP
   Service Worker atualizado: API sempre vai para a rede, nunca para cache */

var CACHE_NAME = 'italy-erp-v5';

var ARQUIVOS_CACHE = [
  '/',
  '/index.html'
];

self.addEventListener('install', function(event) {
  console.log('[SW] instalando v5');
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ARQUIVOS_CACHE).catch(function(e) {
        console.warn('[SW] erro ao cachear arquivos:', e);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('[SW] ativando v5, limpando caches antigos');
  event.waitUntil(
    caches.keys().then(function(nomes) {
      return Promise.all(
        nomes.filter(function(nome) {
          return nome !== CACHE_NAME;
        }).map(function(nome) {
          console.log('[SW] removendo cache antigo:', nome);
          return caches.delete(nome);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  var url = event.request.url;
  var metodo = event.request.method;

  if (url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(function(e) {
        console.warn('[SW] falha na API (sem rede?):', url);
        return new Response(
          JSON.stringify({ ok: false, error: 'sem_conexao', offline: true }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  if (url.includes('patch.js') || url.includes('sw.js')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(function() {
        return caches.match(event.request);
      })
    );
    return;
  }

  if (metodo !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function(resposta) {
        if (resposta && resposta.status === 200 && resposta.type === 'basic') {
          var respostaCopia = resposta.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, respostaCopia);
          });
        }
        return resposta;
      })
      .catch(function() {
        return caches.match(event.request).then(function(cached) {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});
