const https = require('https');
const BASE = 'https://adm.italyembalagens.com.br';
const ENDPOINTS = [
  '/api/version',
  '/api/ofs',
  '/api/clientes',
  '/api/fornecedores',
  '/api/vendedores',
  '/api/maquinas',
  '/api/operadores',
  '/api/amostras',
  '/api/passagens/historico',
  '/api/maquinas/relatorio-mensal',
  '/api/caixas-perdidas/dashboard',
  '/api/relatorios/custos',
  '/api/central-custos/visao-geral',
  '/api/contas-pagar',
  '/api/contas-receber',
];
let res = { c2xx: 0, c401: 0, c403: 0, c5xx: 0, others: [] };
let done = 0;
ENDPOINTS.forEach(function(p) {
  const url = BASE + p + (p.indexOf('?') >= 0 ? '&' : '?') + '_t=' + Date.now();
  const start = Date.now();
  https.get(url, { timeout: 20000, headers: { 'User-Agent': 'smoke-434148/1.0' } }, function(r) {
    let body = '';
    r.on('data', function(c) { body += c; });
    r.on('end', function() {
      const s = Number(r.statusCode || 0);
      if (s >= 200 && s < 300) res.c2xx++;
      else if (s === 401) res.c401++;
      else if (s === 403) res.c403++;
      else if (s >= 500) res.c5xx++;
      else res.others.push({ path: p, status: s });
      done++;
      console.log('[SMOKE434148]', s, p, 't=' + (Date.now()-start) + 'ms', '| body_preview=', String(body||'').slice(0,80).replace(/\s+/g,' '));
      if (done === ENDPOINTS.length) {
        const ok = (res.c5xx === 0 && res.c403 === 0 && res.c2xx >= 1);
        console.log('\n[SMOKE434148 TOTAL]', JSON.stringify(res, null, 2));
        console.log(ok ? '✅ SMOKE OK — c5xx=0, c403=0, c2xx>=1' : '❌ SMOKE FALHOU');
        process.exit(ok ? 0 : 1);
      }
    });
  }).on('error', function(e) {
    res.others.push({ path: p, err: e.message });
    done++;
    console.log('[SMOKE434148] ERR', p, e.message);
    if (done === ENDPOINTS.length) { console.log('\n[SMOKE434148 TOTAL]', JSON.stringify(res, null, 2)); process.exit(1); }
  }).on('timeout', function() { this.destroy(new Error('timeout 20s')); });
});
