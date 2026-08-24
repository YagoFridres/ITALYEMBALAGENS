/* sw.js ÔÇö Italy Embalagens ERP
   Service Worker atualizado: API sempre vai para a rede, nunca para cache */

const CACHE_NAME = 'italy-erp-v20260824140001';

var CACHE_PREFIX = 'italy-erp-v';
var STATIC_ASSET_RE = /\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|otf|eot)$/i;

function isNetworkOnlyPath(url, request) {
  if (!url) return false;
  if (url.includes('/patch.js') || url.includes('/sw.js')) return true;
  if (request && request.mode === 'navigate') return true;
  if (url === self.location.origin + '/' || url.includes('/index.html')) return true;
  return false;
}

function isStaticAsset(url) {
  return STATIC_ASSET_RE.test(String(url || ''));
}

self.addEventListener('install', function(event) {
  console.log('[SW] instalando cache:', CACHE_NAME);
  event.waitUntil(Promise.resolve().then(function() {
    self.skipWaiting();
  }));
});

self.addEventListener('activate', function(event) {
  console.log('[SW] ativando cache:', CACHE_NAME, '(limpando antigos)');
  event.waitUntil(
    caches.keys().then(function(nomes) {
      return Promise.all(
        nomes.filter(function(nome) {
          return String(nome || '').indexOf(CACHE_PREFIX) === 0 && nome !== CACHE_NAME;
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

  if (url.includes('/api/_debug/runtime')) {
    event.respondWith(
      fetch(event.request).catch(function() {
        return new Response(
          JSON.stringify({ ok: true, skipped: true, debug: 'disabled' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  if (url.includes('/api/')) {
    var apiRequest = event.request;
    if (metodo === 'GET' || metodo === 'HEAD') {
      try {
        apiRequest = new Request(event.request, { cache: 'no-store' });
      } catch (_) {}
    }
    event.respondWith(
      fetch(apiRequest).catch(function(e) {
        console.warn('[SW] falha na API (sem rede?):', url);
        return new Response(
          JSON.stringify({ ok: false, error: 'sem_conexao', offline: true }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  if (isNetworkOnlyPath(url, event.request)) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(function() {
        return new Response('Offline', { status: 503 });
      })
    );
    return;
  }

  if (metodo !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        if (cached) return cached;
        return fetch(event.request).then(function(resposta) {
          if (resposta && resposta.status === 200 && resposta.type === 'basic') {
            var respostaCopia = resposta.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, respostaCopia);
            });
          }
          return resposta;
        });
      }).catch(function() {
        return new Response('Offline', { status: 503 });
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request, { cache: 'no-store' }).catch(function() {
      return new Response('Offline', { status: 503 });
    })
  );
});
