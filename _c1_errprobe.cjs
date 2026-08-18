const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const BASE = 'https://adm.italyembalagens.com.br';
const TOKEN = jwt.sign({ id: 't', perfil: 'admin', emp_id: 'E1', sigla: 'ITALY' }, 'italy_secret_2026', { expiresIn: '12h' });
const T = '20260813002000';
const RIPKE = 'be617df1-441a-4f11-918e-d813a5ac854c';
const VEND_UUID = '00000000-0000-0000-0000-000000000001';
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
function Rstatic(p) {
  return new Promise(res => {
    https.get({ hostname: 'adm.italyembalagens.com.br', port: 443, path: p + '?__nc=' + Date.now(), headers: { 'Accept-Encoding': 'identity', 'Cache-Control': 'no-cache' } }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => res(d.includes(T))); }).on('error', () => res(false));
  });
}
(async () => {
  // 1 probe para confirmar versão (cache bust)
  console.log('PROBE versao sw.js');
  const vsw = await (new Promise(res => {
    https.get({ hostname: 'adm.italyembalagens.com.br', port: 443, path: '/sw.js?__nc=' + Date.now(), headers: { 'Accept-Encoding': 'identity', 'Cache-Control': 'no-cache' } }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => res(d.includes(T) ? 'OK' : 'NAO')); }).on('error', () => res('ERRO'));
  }));
  console.log({ t: 'VER_SW', versao_esperada: T, presente: vsw });
  const P = { cliente: 'MOVEIS RIPKE', clinome: 'MOVEIS RIPKE', cli_id: RIPKE, cliente_id: RIPKE, descricao: 'ZZZ_TESTE_APAGAR_C1', produto: 'ZZZ_TESTE_APAGAR_C1', quantidade: 10, qtd: 10, data_entrega: '2026-12-31', ent: '2026-12-31', preco: 50, valor_unitario: 50, vendedor: 'VENDEDOR PADRAO', vendedor_id: VEND_UUID, vendId: VEND_UUID, itens: [] };
  console.log('\n--- POST REAL ---');
  const p = await H('POST', '/api/ofs', P);
  fs.writeFileSync('_POST_REAL_C1_ERR.json', JSON.stringify(p, null, 2));
  console.log({ status: p.s, j: p.j, raw0: p.raw0?.slice?.(0, 2000) });
})();
