const https = require('https');
const jwt = require('jsonwebtoken');
const BASE = 'https://adm.italyembalagens.com.br';
const TOKEN = jwt.sign({ id: 't', perfil: 'admin', emp_id: 'E1', sigla: 'ITALY' }, 'italy_secret_2026', { expiresIn: '12h' });
function H(method, path, body) {
  return new Promise(res => {
    try {
      const u = new URL(BASE + path);
      const opts = { method, hostname: u.hostname, port: 443, path: u.pathname + u.search, timeout: 120000, headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json', 'Accept-Encoding': 'identity', 'Cache-Control': 'no-cache' } };
      const r = https.request(opts, rsp => { let d = ''; rsp.on('data', c => d += c); rsp.on('end', () => { let j = null; try { j = d ? JSON.parse(d) : null; } catch (e) { j = { _raw: d.slice(0, 1500) }; } res({ s: rsp.statusCode, j, raw0: d.slice(0, 4000) }); }); });
      r.on('error', e => res({ s: 0, j: null, err: String(e.message) })); r.on('timeout', () => { r.destroy(); res({ s: -1, j: null, err: 'timeout' }); });
      if (body) r.write(JSON.stringify(body)); r.end();
    } catch (e) { res({ s: -2, j: null, err: String(e.message) }); }
  });
}
(async () => {
  // 1) /api/ofs?limit=1 normal
  const a = await H('GET', '/api/ofs?limit=1&sort=created_at_desc');
  console.log('GET /api/ofs limit 1: status', a.s, ' qtd data:', (Array.isArray(a.j?.data) ? a.j.data.length : '?'), 'keys:', a.j && typeof a.j === 'object' ? Object.keys(a.j).slice(0, 10) : '');
  console.log('primeiro:', JSON.stringify((Array.isArray(a.j?.data) ? a.j.data[0] : null), null, 2).slice(0, 500));
  // 2) DIAG
  const b = await H('GET', '/api/_diag_proxnum');
  console.log('\nDIAG completo:', JSON.stringify(b.j, null, 2).slice(0, 1500));
})();
