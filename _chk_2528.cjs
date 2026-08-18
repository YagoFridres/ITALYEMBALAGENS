const https = require('https');
const jwt = require('jsonwebtoken');
const BASE = 'https://adm.italyembalagens.com.br';
const TOKEN = jwt.sign({ id: 't', perfil: 'admin', emp_id: 'E1', sigla: 'ITALY' }, 'italy_secret_2026', { expiresIn: '10h' });
function R(method, path, body) {
  return new Promise(resolve => {
    try {
      const u = new URL(BASE + path);
      const opts = { method, hostname: u.hostname, port: 443, path: u.pathname + u.search, timeout: 60000, headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json', 'Accept-Encoding': 'identity' } };
      const r = https.request(opts, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { let j = null; try { j = d ? JSON.parse(d) : null; } catch (e) { j = {}; } resolve({ s: res.statusCode, j, raw0: d.slice(0, 12000) }); }); });
      r.on('error', e => resolve({ s: 0, j: null, err: String(e.message) })); r.on('timeout', () => { r.destroy(); resolve({ s: -1, j: null, err: 'timeout' }); });
      if (body) r.write(JSON.stringify(body)); r.end();
    } catch (e) { resolve({ s: -2, j: null, err: String(e.message) }); }
  });
}
(async () => {
  const D = await R('GET', '/api/_diag_proxnum?empId=df5f7672-0a6b-402d-ae65-296554236c31&empresa_id=df5f7672-0a6b-402d-ae65-296554236c31');
  console.log('DIAG_RESP s=', D.s);
  console.log('iguais=', D.j?.iguais, 'emp_res=', D.j?.emp_por_resolver, 'emp_ctx=', D.j?.emp_por_ctx);
  if (D.j?.res_por_ctx) console.log('RES_CTX top15=', JSON.stringify(D.j.res_por_ctx.top15, null, 2));
  if (D.j?.res_por_resolver) console.log('RES_RESOLVER top15=', JSON.stringify(D.j.res_por_resolver.top15, null, 2));
  // Busca por numero=2528
  const F = await R('GET', '/api/ofs?limit=50&busca=2528');
  console.log('BUSCA_2528 s=', F.s, 'total=', F.j?.total);
  (F.j?.data || []).forEach(o => {
    console.log('OF NUM=' + (o.numero || o.of) + ' id=' + (o.id || '').slice(0, 20) + ' cliente=' + String(o?.clinome || o?.cliente || '').slice(0, 20) + ' emp=' + o.empresa + ' status=' + o.status + ' excluido=' + (o?.deleted_at ? 'SIM' : 'NAO'));
  });
})();
