const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const BASE = 'https://adm.italyembalagens.com.br';
const TOKEN = jwt.sign({ id: 't', perfil: 'admin', emp_id: 'E1', sigla: 'ITALY' }, 'italy_secret_2026', { expiresIn: '12h' });
const T = '20260813011500';
function H(method, path, body) {
  return new Promise(res => {
    const u = new URL(BASE + path);
    const opts = { method, hostname: u.hostname, port: 443, path: u.pathname + u.search, timeout: 30000, headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json', 'Accept-Encoding': 'identity', 'Cache-Control': 'no-cache' } };
    const r = https.request(opts, rsp => { let d = ''; rsp.on('data', c => d += c); rsp.on('end', () => { let j = null; try { j = d ? JSON.parse(d) : null; } catch (e) { j = { _raw: d.slice(0, 1500) }; } res({ s: rsp.statusCode, j, raw0: d.slice(0, 3000) }); }); });
    r.on('error', e => res({ s: 0, j: null, err: String(e.message) })); r.on('timeout', () => { r.destroy(); res({ s: -1, j: null, err: 'timeout' }); });
    if (body) r.write(JSON.stringify(body)); r.end();
  });
}
function Rstatic(p) {
  return new Promise(res => {
    https.get({ hostname: 'adm.italyembalagens.com.br', port: 443, path: p + '?__nc=' + Date.now(), headers: { 'Accept-Encoding': 'identity', 'Cache-Control': 'no-cache' } }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => res(d.includes(T))); }).on('error', () => res(false));
  });
}
(async () => {
  for (let k = 0; k < 25; k++) {
    const a = await Rstatic('/sw.js');
    const b = await Rstatic('/index.html');
    const c = await Rstatic('/patch.js');
    const d = await H('GET', '/api/_diag_proxnum');
    const err = d.j?.res_por_resolver?.erro || d.j?.res_por_ctx?.erro || null;
    const maior = d.j?.res_por_resolver?.maior || 0;
    const okBackend = !err || !String(err).includes('numero_of');
    const flag = (a && b && c && okBackend) ? 'OK_ALL' : ((a && b && c) ? 'OK_STATIC_ONLY' : ((!a || !b || !c) ? 'NAO_STATIC' : ''));
    console.log(JSON.stringify({ k, sw: a, idx: b, pjs: c, backendNumeroOfErro: !!err && String(err).includes('numero_of'), err: err ? String(err).slice(0,200) : null, maior, flag }));
    if (flag === 'OK_ALL') { console.log('DEPLOY OK'); process.exit(0); }
    await new Promise(r => setTimeout(r, 20000));
  }
  console.log('DEPLOY TIMEOUT BACKEND');
  process.exit(2);
})();
