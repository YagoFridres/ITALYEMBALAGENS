const CACHE_VERSION = 'italy-erp-pwa-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

const OFFLINE_HTML = `<!DOCTYPE html><html lang="pt-BR"><head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
<meta name="theme-color" content="#0f1117"/>
<title>Italy ERP — Offline</title>
<style>
  html,body{height:100%;margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial}
  body{background:#0f1117;color:#e5e7eb;display:flex;align-items:center;justify-content:center;padding:18px}
  .card{max-width:520px;width:100%;background:#17191f;border:1px solid #2a2d38;border-radius:14px;padding:18px}
  .t{font-weight:900;margin:0 0 6px 0}
  .s{color:#94a3b8;margin:0 0 12px 0;line-height:1.35}
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:10px;border:1px solid #2a2d38;background:#1e2028;color:#e5e7eb;padding:10px 14px;font-weight:800;cursor:pointer}
  .dot{display:inline-block;width:10px;height:10px;border-radius:50%;background:#dc2626}
  .dot.on{background:#16a34a}
</style>
</head><body>
  <div class="card">
    <h2 class="t">Sem conexão</h2>
    <p class="s">O ERP está sem internet no momento. Assim que a conexão voltar, ele atualiza automaticamente.</p>
    <button class="btn" onclick="location.reload()"><span class="dot"></span> Tentar reconectar</button>
  </div>
  <script>
    const dot=document.querySelector('.dot');
    function upd(){ dot.classList.toggle('on', navigator.onLine); }
    window.addEventListener('online', ()=>{ upd(); setTimeout(()=>location.reload(), 300); });
    window.addEventListener('offline', upd);
    upd();
  </script>
</body></html>`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      await cache.addAll(CORE_ASSETS);
      self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k !== CACHE_VERSION ? caches.delete(k) : Promise.resolve())));
      self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(req));
    return;
  }

  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE_VERSION);
          cache.put('/index.html', fresh.clone());
          return fresh;
        } catch (e) {
          const cached = await caches.match('/index.html');
          return cached || new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
        }
      })()
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.ok && (url.origin === self.location.origin)) {
          const cache = await caches.open(CACHE_VERSION);
          cache.put(req, fresh.clone());
        }
        return fresh;
      } catch (e) {
        return cached || new Response('', { status: 504 });
      }
    })()
  );
});
