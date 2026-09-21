const https = require('https');
const BASE = 'https://adm.italyembalagens.com.br';
const ENDPOINTS = [
  ['/', 200],
  ['/api/version', 200],
  ['/api/auth/whoami', 401],
  ['/api/orcamentos?limite=1', 401],
  ['/api/ofs?limite=1', 401],
  ['/api/clientes?limite=1', 401],
  ['/api/fornecedores?limite=1', 401],
  ['/api/vendedores?limite=1', 401],
  ['/api/chapas/estoque?limite=1', 401],
  ['/api/central-custos/visao-geral?mes=9&ano=2026', 401],
  ['/api/central-custos/lancamentos?mes=9&ano=2026', 401],
  ['/api/central-custos/centros', 401],
  ['/api/relatorios/custos?mes=9&ano=2026', 401],
  ['/api/comissoes?mes=9&ano=2026', 401],
  ['/api/caixas-perdidas?mes=9&ano=2026', 401],
];

function get(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'User-Agent': 'smoke-434153' } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body0: d.slice(0, 50) }));
    });
    req.on('error', (e) => resolve({ status: -1, err: e.message }));
    req.setTimeout(12000, () => { req.destroy(); resolve({ status: -2 }); });
  });
}

(async () => {
  const counts = { c2xx: 0, c401: 0, c403: 0, c5xx: 0, other: 0 };
  const lines = [];
  for (let i = 0; i < ENDPOINTS.length; i++) {
    const [path, exp] = ENDPOINTS[i];
    const r = await get(BASE + path);
    const code = r.status;
    if (code >= 200 && code < 300) counts.c2xx++;
    else if (code === 401) counts.c401++;
    else if (code === 403) counts.c403++;
    else if (code >= 500) counts.c5xx++;
    else counts.other++;
    const ok = (code === exp) ? '✓' : '✗';
    lines.push(`${ok} ${String(code).padEnd(3)} ${path}`);
  }
  lines.forEach(l => console.log(l));
  console.log('');
  console.log('Summary:', JSON.stringify(counts));
  const PASS = counts.c403 === 0 && counts.c5xx === 0 && counts.c2xx >= 1;
  console.log(PASS ? '✅ SMOKE PASS' : '❌ SMOKE FAIL');
  process.exit(PASS ? 0 : 1);
})();
