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
  // BUSCAR OFs com numero>=2585
  const q = encodeURIComponent('select=id,numero,of,of_num,empresa_id,emp_id,clinome,descricao,deleted_at,created_at&order=numero.desc&limit=50');
  const p = await H('GET', '/api/_oneshot_supabase_adhoc?table=ofs&q=' + q);
  const data = Array.isArray(p.j?.data) ? p.j.data : [];
  const top = data.filter(r => String(r?.numero ?? '').trim()).slice(0, 20).map(r => ({ n: Number(r.numero || '0' || 0), numero: r.numero, of: r.of, of_num: r.of_num, id: String(r.id || '').slice(0, 20), emp_id: r.emp_id, empresa_id: r.empresa_id ? String(r.empresa_id).slice(0, 8) + '...' : '', clinome: (r.clinome || '').slice(0, 20), desc: (r.descricao || '').slice(0, 30), deleted: !!r.deleted_at }));
  fs.writeFileSync('_TOP_OF_NUM.json', JSON.stringify({ raw: p.raw0, top }, null, 2));
  console.log(JSON.stringify({ t: 'TOP_NUM', top }, null, 2));
  // Achar exatamente 2590
  const v2590 = data.find(r => String(r.numero || '') === '2590' || String(r.of || '') === '2590' || String(r.of_num || '') === '2590');
  console.log('\n2590 exato:', JSON.stringify(v2590, null, 2));
})();
