const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const BASE = 'https://adm.italyembalagens.com.br';
const TOKEN = jwt.sign({ id: 't', perfil: 'admin', emp_id: 'E1', sigla: 'ITALY' }, 'italy_secret_2026', { expiresIn: '10h' });
const OUT = '_limpa100k_result.jsonl';
fs.writeFileSync(OUT, '');
function L(o) { const s = JSON.stringify(o); fs.appendFileSync(OUT, s + '\n'); console.log(s.slice(0, 500)); }
function S(ms) { return new Promise(r => setTimeout(r, ms)); }
function R(method, path, body) {
  return new Promise(resolve => {
    try {
      const u = new URL(BASE + path);
      const opts = { method, hostname: u.hostname, port: 443, path: u.pathname + u.search, timeout: 120000, headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' } };
      const r = https.request(opts, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { let j = null; try { j = d ? JSON.parse(d) : null; } catch (e) { j = {}; } resolve({ s: res.statusCode, j, raw0: d.slice(0, 1500) }); }); });
      r.on('error', e => resolve({ s: 0, j: null, err: String(e.message) })); r.on('timeout', () => { r.destroy(); resolve({ s: -1, j: null, err: 'timeout' }); });
      if (body) r.write(JSON.stringify(body)); r.end();
    } catch (e) { resolve({ s: -2, j: null, err: String(e.message) }); }
  });
}
(async () => {
  const E = 'df5f7672-0a6b-402d-ae65-296554236c31';
  for (let i = 0; i < 3; i++) {
    const osi = await R('POST', '/api/_oneshot_limpar_ofs_italy_testes', {});
    L({ round: i, tipo: 'ITALY', total_analisado: osi.j?.total_analisado, total_alvos: osi.j?.total_alvos, atualizados: osi.j?.atualizados, detalhes10: (osi.j?.detalhes || []).slice(0, 10) });
    const oso = await R('POST', '/api/_oneshot_limpar_ofs_orfas_100k', {});
    L({ round: i, tipo: 'ORFAS', total_analisado: oso.j?.total_analisado, total_alvos: oso.j?.total_alvos, atualizados: oso.j?.atualizados });
    await S(3000);
    const pn = await R('GET', '/api/ofs/proximo-numero?empId=' + E);
    L({ round: i, proxnum: pn.j });
    if (pn.j && parseInt(String(pn.j.proximo || '0')) === 2605) break;
  }
  process.exit(0);
})();
