const https = require('https');
const fs = require('fs');
const RAW = fs.readFileSync('_token_admin.txt', 'utf8');
const TOKEN_LINE = RAW.replace(/[\uFEFF\uFFFE\u200B\u200C\u200D\u0000-\u001F]/g, '').split('\n').map(s=>s.trim()).filter(Boolean)[0] || '';
if (!TOKEN_LINE) { console.error('EMPTY_TOKEN'); process.exit(2); }
console.error('TOKEN_LEN=' + TOKEN_LINE.length + ' FIRST_50=' + TOKEN_LINE.slice(0,50));
const BASE = 'https://adm.italyembalagens.com.br';
const CANDIDATOS = [
  '/api/hub/inteligencia', '/api/dashboard/total-geral', '/api/dashboard/faturamento-mensal',
  '/api/hub/atividades-recentes', '/api/atividades/recentes', '/api/hub/atividades', '/api/atividades', '/api/historico_acoes',
  '/api/hub/passagens-hoje', '/api/passagens/hoje', '/api/passagens/historico?data_inicio=2026-08-13&data_fim=2026-08-13&limit=50',
  '/api/hub/ofs-por-dia', '/api/ofs/por-dia', '/api/ofs/por-dia/hoje', '/api/hub/ofs-hoje', '/api/ofs/hoje',
  '/api/hub/avisos-pendencias', '/api/hub/pendencias', '/api/hub/avisos', '/api/pendencias',
  '/api/hub/widgets', '/api/widgets/hub', '/api/hub/resumo', '/api/hub/summary', '/api/hub/detalhe',
  '/api/dashboard/hoje', '/api/hub/kpis-originais',
];
function one(path) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    try {
      const req = https.get(BASE + path, {
        headers: { 'Authorization': ('Bearer ' + TOKEN_LINE).replace(/[^\x20-\x7E]/g, ''), 'Accept': 'application/json' },
        timeout: 15000,
      }, (res) => {
        let buf = '';
        res.setEncoding('utf8');
        res.on('data', c => { buf += c; if (buf.length > 500) res.destroy(); });
        res.on('end', () => {
          const ms = Date.now() - t0;
          try {
            const j = JSON.parse(buf || '{}');
            resolve({ path, status: res.statusCode, ms, bodySize: buf.length, ok: j.ok ?? null, alertas: Array.isArray(j.alertas) ? j.alertas.length : null, keys: Object.keys(j).slice(0, 8).join(','), sample: (buf||'').slice(0, 100) });
          } catch (_) {
            resolve({ path, status: res.statusCode, ms, bodySize: buf.length, parseErr: true, sample: (buf||'').slice(0, 100) });
          }
        });
      });
      req.on('timeout', () => { req.destroy(new Error('timeout')); });
      req.on('error', (e) => { resolve({ path, status: 'ERR', ms: Date.now()-t0, err: String(e.message||e).slice(0,120) }); });
    } catch (e) {
      resolve({ path, status: 'EXC', ms: Date.now()-t0, err: String(e.message||e).slice(0,120) });
    }
  });
}
(async () => {
  const t0 = Date.now();
  const results = [];
  for (const p of CANDIDATOS) {
    results.push(await one(p));
  }
  const out = { total_ms: Date.now()-t0, results };
  fs.writeFileSync('_PROBE_HUB_WIDGETS.json', JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify({
    total_ms: out.total_ms,
    count_2xx: results.filter(r=> typeof r.status==='number' && r.status>=200 && r.status<300).length,
    count_404: results.filter(r=> r.status===404).length,
    count_5xx: results.filter(r=> typeof r.status==='number' && r.status>=500).length,
    count_TIMEOUT: results.filter(r=> r.status==='ERR' && /timeout/i.test(r.err||'')).length,
    count_ERR: results.filter(r=> r.status==='ERR').length,
  }, null, 2));
  process.exit(0);
})();
