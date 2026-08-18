const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const BASE = 'https://adm.italyembalagens.com.br';
const TOKEN = jwt.sign({ id: 't', perfil: 'admin', emp_id: 'E1', sigla: 'ITALY' }, 'italy_secret_2026', { expiresIn: '10h' });
const OUT = '_DIAG_PROXNUM_FINAL.jsonl';
const TARGET = '20260812181500';
fs.writeFileSync(OUT, '');
function L(o) { const s = JSON.stringify(o); fs.appendFileSync(OUT, s + '\n'); console.log(s.length > 1500 ? s.slice(0, 1500) + '...' : s); }
function S(ms) { return new Promise(r => setTimeout(r, ms)); }
function R(method, path, body) {
  return new Promise(resolve => {
    try {
      const u = new URL(BASE + path);
      const opts = { method, hostname: u.hostname, port: 443, path: u.pathname + u.search, timeout: 60000, headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json', 'Accept-Encoding': 'identity' } };
      const r = https.request(opts, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { let j = null; try { j = d ? JSON.parse(d) : null; } catch (e) { j = {}; } resolve({ s: res.statusCode, j, raw0: d.slice(0, 2000) }); }); });
      r.on('error', e => resolve({ s: 0, j: null, err: String(e.message) })); r.on('timeout', () => { r.destroy(); resolve({ s: -1, j: null, err: 'timeout' }); });
      if (body) r.write(JSON.stringify(body)); r.end();
    } catch (e) { resolve({ s: -2, j: null, err: String(e.message) }); }
  });
}
(async () => {
  try {
    for (let i = 0; i < 18; i++) {
      const idx = await R('GET', '/index.html'); const sw = await R('GET', '/sw.js');
      const idxOk = String(idx.raw0 || '').includes(TARGET); const swOk = String(sw.raw0 || '').includes(TARGET);
      L({ t: 'POLL', i, idxOk, swOk });
      if (idxOk && swOk) break;
      await S(10000);
    }
    const osi = await R('POST', '/api/_oneshot_limpar_ofs_italy_testes', {});
    L({ t: 'ONESHOT_ITALY', atualizados: osi.j?.atualizados, detalhes10: (osi.j?.detalhes || []).slice(0, 10) });
    const oso = await R('POST', '/api/_oneshot_limpar_ofs_orfas_100k', {});
    L({ t: 'ONESHOT_ORFAS', atualizados: oso.j?.atualizados });
    await S(4000);
    const diag = await R('GET', '/api/_diag_proxnum?empId=df5f7672-0a6b-402d-ae65-296554236c31&empresa_id=df5f7672-0a6b-402d-ae65-296554236c31');
    L({ t: 'DIAG_PROXNUM_FULL', j: diag.j });
    process.exit(0);
  } catch (e) {
    L({ t: 'ERR', msg: String(e), st: String(e.stack || '').slice(0, 800) });
    process.exit(1);
  }
})();
