const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');
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
  // buscar numero=2590
  const b2590 = await H('GET', '/api/ofs/buscar?numero=2590');
  console.log({ t: 'BUSCA_2590', status: b2590.s, body: b2590.j });
  const arr = (Array.isArray(b2590.j?.data) ? b2590.j.data : (Array.isArray(b2590.j) ? b2590.j : []));
  console.log('\nOFs com 2590:', arr.length);
  arr.forEach(r => console.log('  -', JSON.stringify({ id: String(r.id || '').slice(0, 25), numero: r.numero, of: r.of, of_num: r.of_num, emp_id: r.emp_id, empresa_id: r.empresa_id ? String(r.empresa_id).slice(0, 20) : '', clinome: r.clinome, desc: (r.descricao || '').slice(0, 40), deleted: !!r.deleted_at })));
  // Tentar encontrar pelo endpoint listar OFs com limit alto
  console.log('\nBuscando listagem recente (limit 200)...');
  const lis = await H('GET', '/api/ofs?limit=200&sort=created_at_desc');
  const dat = Array.isArray(lis.j?.data) ? lis.j.data : (Array.isArray(lis.j) ? lis.j : []);
  console.log('listagem qtd:', dat.length);
  const top = dat.map(r => ({ n: Number(r.numero || r.of || r.of_num || 0), num: r.numero, of: r.of, ofn: r.of_num, clinome: (r.clinome || '').slice(0, 15), emp_id: r.emp_id, deleted: !!r.deleted_at })).sort((a, b) => b.n - a.n).slice(0, 25);
  top.forEach((r, i) => console.log(String(i + 1).padStart(2), JSON.stringify(r)));
})();
