const https = require('https');
const endpoints = [
  '/api/version',
  '/api/vendedores/lista',
  '/api/clientes/lista',
  '/api/fornecedores/lista',
  '/api/maquinas/lista',
  '/api/comissoes/relatorio?mes=9&ano=2026',
  '/api/central-custos/visao-geral?mes=9&ano=2026',
  '/api/relatorios/custos?mes=9&ano=2026',
  '/api/contas-pagar?mes=9&ano=2026',
  '/api/contas-receber?mes=9&ano=2026',
  '/api/lancamentos-custos?mes=9&ano=2026',
  '/api/centros-custo/lista',
  '/api/usuarios/lista',
  '/api/relatorios/caixas-perdidas?mes=8&ano=2026',
  '/api/passagens/historico?mes=9&ano=2026'
];
function fetchJson(path) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'adm.italyembalagens.com.br',
      port: 443,
      path: path + (path.indexOf('?') >= 0 ? '&_t=' : '?_t=') + Date.now() + Math.random().toString(36).slice(2, 8),
      method: 'GET',
      headers: { Accept: 'application/json' },
      timeout: 12000
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d.slice(0, 80) }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
    req.end();
  });
}
async function main() {
  let c2xx = 0, c401 = 0, c403 = 0, c4xx = 0, c5xx = 0;
  const results = [];
  for (let i = 0; i < endpoints.length; i++) {
    const ep = endpoints[i];
    let st = -1, ok = false;
    try { const r = await fetchJson(ep); st = r.status || 0; ok = true; } catch (e) { st = 0; results.push([ep, 'ERR', String(e.message || e).slice(0, 80)]); continue; }
    if (st >= 200 && st < 300) c2xx++;
    else if (st === 401) c401++;
    else if (st === 403) c403++;
    else if (st >= 400 && st < 500) c4xx++;
    else if (st >= 500) c5xx++;
    results.push([ep, st, '']);
  }
  console.log('SMOKE 15 endpoints 434150:');
  results.forEach(r => console.log('  ' + String(r[1]).padStart(5, ' ') + ' ' + r[0] + (r[2] ? ' | ' + r[2] : '')));
  console.log('RESUMO: c2xx=' + c2xx + ' c401=' + c401 + ' c403=' + c403 + ' c4xx_outros=' + (c4xx - c401 - c403) + ' c5xx=' + c5xx);
  const fail = (c403 > 0 || c5xx > 0);
  console.log((fail ? '❌ FAIL' : '✅ PASS c403=0 c5xx=0'));
  process.exit(fail ? 1 : 0);
}
main();
