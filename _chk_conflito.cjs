const https = require('https');
const jwt = require('jsonwebtoken');
const BASE = 'https://adm.italyembalagens.com.br';
const TOKEN = jwt.sign({ id: 't', perfil: 'admin', emp_id: 'E1', sigla: 'ITALY' }, 'italy_secret_2026', { expiresIn: '10h' });
const EMP = 'df5f7672-0a6b-402d-ae65-296554236c31';
function R(method, path, body) {
  return new Promise(resolve => {
    try {
      const u = new URL(BASE + path);
      const opts = { method, hostname: u.hostname, port: 443, path: u.pathname + u.search, timeout: 60000, headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json', 'Accept-Encoding': 'identity', 'Cache-Control':'no-cache' } };
      const r = https.request(opts, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { let j = null; try { j = d ? JSON.parse(d) : null; } catch (e) { j = {}; } resolve({ s: res.statusCode, j, raw0: d.slice(0, 4000) }); }); });
      r.on('error', e => resolve({ s: 0, j: null, err: String(e.message) })); r.on('timeout', () => { r.destroy(); resolve({ s: -1, j: null, err: 'timeout' }); });
      if (body) r.write(JSON.stringify(body)); r.end();
    } catch (e) { resolve({ s: -2, j: null, err: String(e.message) }); }
  });
}
(async () => {
  // Testa conflito manual: empresa_id=EMP, numero=2528 (SAMII) vs 2529...2600
  for (let n = 2528; n <= 2540; n++) {
    const c = String(n);
    const path = `/api/ofs?select=id,numero,of,of_num,clinome,empresa_id,emp_id&empresa_id=eq.${EMP}&or=numero.eq.${c},of.eq.${c},of_num.eq.${c}&limit=10`;
    // nao temos endpoint supabase direto, usar endpoint /api/ofs busca
    const F = await R('GET', '/api/ofs?limit=20&busca=' + c);
    const hits = (F.j?.data || []).filter(o => String(o.numero || o.of || '') === c && (o.empresa_id === EMP || o.emp_id === 'E1' || /ITALY/i.test(o.empresa || '') || !o.empresa));
    if (hits.length) console.log('n=', n, 'ENCONTRADO ITALY:', hits.map(h => ({ id: String(h.id || '').slice(0, 15), num: h.numero, cliente: String(h?.clinome || '').slice(0, 25), status: h.status, emp: h.empresa || h.emp_id })));
    else console.log('n=', n, 'NAO encontrado para ITALY via busca');
  }
})();
