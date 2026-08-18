const https = require('https');
const jwt = require('jsonwebtoken');
const BASE = 'https://adm.italyembalagens.com.br';
const TOKEN = jwt.sign({ id: 't', perfil: 'admin', emp_id: 'E1', sigla: 'ITALY' }, 'italy_secret_2026', { expiresIn: '10h' });
function R(method, path, body) {
  return new Promise(resolve => {
    try {
      const u = new URL(BASE + path);
      const opts = { method, hostname: u.hostname, port: 443, path: u.pathname + u.search, timeout: 60000, headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json', 'Accept-Encoding': 'identity', 'Cache-Control':'no-cache' } };
      const r = https.request(opts, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { let j = null; try { j = d ? JSON.parse(d) : null; } catch (e) { j = {}; } resolve({ s: res.statusCode, j, raw0: d.slice(0, 6000) }); }); });
      r.on('error', e => resolve({ s: 0, j: null, err: String(e.message) })); r.on('timeout', () => { r.destroy(); resolve({ s: -1, j: null, err: 'timeout' }); });
      if (body) r.write(JSON.stringify(body)); r.end();
    } catch (e) { resolve({ s: -2, j: null, err: String(e.message) }); }
  });
}
(async () => {
  // Busca ids exata 2528 2531 da ITALY
  for (const n of ['2528','2531']) {
    const X = await R('GET', '/api/ofs?busca=' + n + '&limit=30');
    const r = (X.j?.data || []).filter(o => o.numero === n || o.of === n || o.of_num === n)
      .map(o => ({
        id: String(o.id||'').slice(0,16),
        n: o.numero, of:o.of, of_num:o.of_num,
        cliente: (o.clinome||'').slice(0,25),
        empresa: (o.empresa||'').slice(0,12),
        empresa_id: String(o.empresa_id||'').slice(0,10),
        emp_id: o.emp_id,
        created: String(o.created_at||'').slice(0,16),
        del: o.deleted_at ? 'DEL' : ''
      }));
    console.log('---- N=' + n + ' raw (' + r.length + '):');
    r.forEach(x => console.log(JSON.stringify(x)));
  }
  // DIAG PROXN
  const D = await R('GET', '/api/_diag_proxnum');
  console.log('\nDIAG_PROXN raw0:', JSON.stringify(D.j, null, 2).slice(0, 3000));
})();
