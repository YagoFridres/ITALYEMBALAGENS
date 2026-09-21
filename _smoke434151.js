const https = require('https');
const BASE = 'https://adm.italyembalagens.com.br';
const ENDPOINTS = [
  '/api/version',
  '/api/health',
  '/api/comissoes/relatorio?mes=9&ano=2026',
  '/api/central-custos/visao-geral?mes=9&ano=2026',
  '/api/central-custos/historico?meses=6',
  '/api/relatorios/custos?mes=9&ano=2026',
  '/api/fornecedores',
  '/api/clientes?limit=200',
  '/api/centros-custo',
  '/api/ofs?limit=50',
  '/api/maquinas?limit=50',
  '/api/relatorios/caixas-perdidas?mes=9&ano=2026',
  '/api/contas-pagar?mes=9&ano=2026&limit=50',
  '/api/contas-receber?mes=9&ano=2026&limit=50',
  '/api/produtos?limit=50',
];
async function main() {
  const stats = { c2xx: 0, c401: 0, c403: 0, c5xx: 0, coutros: 0 };
  const results = [];
  for (let i = 0; i < ENDPOINTS.length; i++) {
    const url = BASE + ENDPOINTS[i] + (ENDPOINTS[i].indexOf('?') >= 0 ? '&' : '?') + '_t=' + Date.now() + '_' + i;
    try {
      const resp = await new Promise((resolve, reject) => {
        const req = https.get(url, { timeout: 15000, headers: { 'Accept': 'application/json' } }, (res) => {
          let data = '';
          res.on('data', (c) => data += c);
          res.on('end', () => resolve({ status: res.statusCode, body: data.slice(0,120) }));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
      });
      const s = resp.status;
      if (s >= 200 && s < 300) stats.c2xx++;
      else if (s === 401) stats.c401++;
      else if (s === 403) stats.c403++;
      else if (s >= 500) stats.c5xx++;
      else stats.coutros++;
      results.push({ url: ENDPOINTS[i], status: s, snippet: resp.body.replace(/\s+/g,' ').slice(0,80) });
      console.log(`[${(i+1).toString().padStart(2,'0')}/${ENDPOINTS.length}] HTTP${s} ${ENDPOINTS[i].slice(0,60)}`);
    } catch (e) {
      stats.coutros++;
      results.push({ url: ENDPOINTS[i], status: 0, error: e.message });
      console.log(`[${(i+1).toString().padStart(2,'0')}/${ENDPOINTS.length}] ERRO ${ENDPOINTS[i].slice(0,60)}: ${e.message}`);
    }
  }
  console.log('\n=== SMOKE 434151 RESULT ===');
  console.log(JSON.stringify(stats));
  const OK = stats.c403 === 0 && stats.c5xx === 0 && stats.c2xx >= 1;
  console.log(OK ? '✅ PASS: c403=0, c5xx=0, c2xx>=1. Fact19 RLS protegido.' : '❌ FAIL: verificar acima.');
  process.exit(OK ? 0 : 1);
}
main().catch(e => { console.error('FATAL:', e); process.exit(2); });
