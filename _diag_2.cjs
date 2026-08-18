const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const BASE = 'https://adm.italyembalagens.com.br';
const TOKEN = jwt.sign({ id: 't', perfil: 'admin', emp_id: 'E1', sigla: 'ITALY' }, 'italy_secret_2026', { expiresIn: '10h' });
const OUT = '_DIAG_PROXNUM.log';
fs.writeFileSync(OUT, '');
function L(s){fs.appendFileSync(OUT, s + '\n'); console.log(s); }
function R(method, path, body) {
  return new Promise(resolve => {
    try {
      const u = new URL(BASE + path);
      const opts = { method, hostname: u.hostname, port: 443, path: u.pathname + u.search, timeout: 60000, headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json', 'Accept-Encoding': 'identity' } };
      const r = https.request(opts, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { let j = null; try { j = d ? JSON.parse(d) : null; } catch (e) { j = {}; } resolve({ s: res.statusCode, j, raw: d }); }); });
      r.on('error', e => resolve({ s: 0, j: null, err: String(e.message) })); r.on('timeout', () => { r.destroy(); resolve({ s: -1, j: null, err: 'timeout' }); });
      if (body) r.write(JSON.stringify(body)); r.end();
    } catch (e) { resolve({ s: -2, j: null, err: String(e.message) }); }
  });
}
(async() => {
  for (let i = 0; i < 12; i++) {
    const idx = await R('GET', '/index.html');
    const sw = await R('GET', '/sw.js');
    const iOk = String(idx.raw || '').includes('20260812181500');
    const sOk = String(sw.raw || '').includes('20260812181500');
    L('POLL i=' + i + ' idx=' + (iOk ? 'OK' : 'NO') + ' sw=' + (sOk ? 'OK' : 'NO'));
    if (iOk && sOk) break;
    await new Promise(r => setTimeout(r, 10000));
  }
  const osi = await R('POST', '/api/_oneshot_limpar_ofs_italy_testes', {});
  L('ONESHOT_ITALY s=' + osi.s + ' atualizados=' + osi.j?.atualizados + ' first=' + JSON.stringify((osi.j?.detalhes || []).slice(0,3)));
  const oso = await R('POST', '/api/_oneshot_limpar_ofs_orfas_100k', {});
  L('ONESHOT_ORFAS s=' + oso.s + ' atualizados=' + oso.j?.atualizados);
  await new Promise(r => setTimeout(r, 4000));
  const d = await R('GET', '/api/_diag_proxnum?empId=df5f7672-0a6b-402d-ae65-296554236c31&empresa_id=df5f7672-0a6b-402d-ae65-296554236c31');
  L('DIAG s=' + d.s + ' body=' + JSON.stringify(d.j || String(d.raw || '').slice(0, 5000)));
})();
