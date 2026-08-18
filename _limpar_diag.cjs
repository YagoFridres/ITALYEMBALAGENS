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
  // 1) LIMPAR 4x oneshot
  for (let k = 0; k < 4; k++) {
    const a = await H('POST', '/api/_oneshot_limpar_ofs_italy_testes');
    const b = await H('POST', '/api/_oneshot_limpar_ofs_orfas_100k');
    console.log({ t: 'LIMPEZA_' + k, ITALY: a.j, ORFAS: b.j });
    await new Promise(r => setTimeout(r, 1200));
  }
  // 2) DIAG
  const d = await H('GET', '/api/_diag_proxnum');
  console.log({ t: 'DIAG', r_maior: d.j?.res_por_resolver?.maior, r_prox: d.j?.res_por_resolver?.proximo, ctx_maior: d.j?.res_por_ctx?.maior });
})();
