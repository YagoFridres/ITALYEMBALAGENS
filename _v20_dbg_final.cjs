const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { execSync } = require('child_process');
const T = '20260812223000';
const OUT_LOG = '_POLL_V20.log';
const BASE = 'https://adm.italyembalagens.com.br';
const TOKEN = jwt.sign({ id: 't', perfil: 'admin', emp_id: 'E1', sigla: 'ITALY' }, 'italy_secret_2026', { expiresIn: '10h' });
fs.writeFileSync(OUT_LOG, '');
function L(s) { fs.appendFileSync(OUT_LOG, s + '\n'); console.log(s); }
function H(method, path, body) {
  return new Promise(res => {
    try {
      const u = new URL(BASE + path);
      const opts = { method, hostname: u.hostname, port: 443, path: u.pathname + u.search, timeout: 60000, headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json', 'Accept-Encoding': 'identity', 'Cache-Control': 'no-cache' } };
      const r = https.request(opts, rsp => { let d = ''; rsp.on('data', c => d += c); rsp.on('end', () => { let j = null; try { j = d ? JSON.parse(d) : null; } catch (e) { j = null; } res({ s: rsp.statusCode, j, raw0: d.slice(0, 5000) }); }); });
      r.on('error', e => res({ s: 0, j: null, err: String(e.message) }));
      r.on('timeout', () => { r.destroy(); res({ s: -1, j: null, err: 'timeout' }); });
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
  // POLL deploy
  const end = Date.now() + 50 * 60 * 1000;
  let okDep = false; let i = 0;
  while (Date.now() < end && !okDep) {
    i++;
    const a = await Rstatic('/sw.js'); const b = await Rstatic('/index.html'); const c = await Rstatic('/patch.js');
    okDep = a && b && c;
    L(`DEP i=${i} ok=${okDep} sw=${a} ix=${b} pt=${c}`);
    if (!okDep) await new Promise(r => setTimeout(r, 7000));
  }
  if (!okDep) { L('DEPLOY_TIMEOUT'); process.exit(3); }
  // 3x LIMPEZA
  for (let k = 0; k < 3; k++) {
    const L1 = await H('POST', '/api/_oneshot_limpar_ofs_italy_testes');
    const L2 = await H('POST', '/api/_oneshot_limpar_ofs_orfas_100k');
    L(`LIMPEZA round=${k} italy=${JSON.stringify(L1.j || {}).slice(0, 150)} orfas=${JSON.stringify(L2.j || {}).slice(0, 150)}`);
    await new Promise(r => setTimeout(r, 1200));
  }
  // DIAG PROXNUM
  const D = await H('GET', '/api/_diag_proxnum');
  L(`DIAG_PROXN MAIOR_RESOLVER=${D.j?.res_por_resolver?.maior} PROXN=${D.j?.res_por_resolver?.proximo}`);
  // 👉 DBG inline POST — CAUSA RAIZ
  const DBG = await H('POST', '/api/_dbg_proxnum_inline_post', {});
  const inf = DBG.j?.info || {};
  const tenta = inf.tentativas || [];
  L(`DBG escolhido=${DBG.j?.escolhido} calc_ok=${inf.calc_ok} calc_val=${inf.calc_val} calc_err=${inf.calc_err || ''} nextSeq=${inf.nextSeq} sigla=${inf.siglaLegadaEmp}`);
  for (const t of tenta) {
    L(`  tent i=${t.i} cand=${t.cand} conflito=${t.conflito} qEx=${t.qEx} err=${t.err || ''} matches=${JSON.stringify(t.emp_matches || [])}`);
  }
  fs.writeFileSync('_DBG_INLINE.json', JSON.stringify({ dbg: DBG.j, diag: D.j }, null, 2));
  // POST baseline uuid 1 OF e checa numero
  const P1 = await H('POST', '/api/ofs', { cliente: 'MÓVEIS RIPKE', clinome: 'MOVEIS RIPKE', descricao: 'ZZZ_TESTE_APAGAR_V20', qtd: 10, data_entrega: '2026-12-31', preco: 50, vendedor: 'VENDEDOR PADRAO', vendedor_id: '00000000-0000-0000-0000-000000000001', itens: [], cli_id: 'be617df1-441a-4f11-918e-d813a5ac854c' });
  const of = P1.j?.data?.[0] || P1.j?.data || P1.j;
  L(`POST_C1 s=${P1.s} numero=${of?.numero} of=${of?.of} id=${String(of?.id||'').slice(0,16)} err=${P1.j?.error || P1.j?.message || ''}`);
  fs.writeFileSync('_DBG_POST1.json', JSON.stringify({ post: P1.j }, null, 2));
  // Limpa OF teste
  for (let k = 0; k < 2; k++) {
    await H('POST', '/api/_oneshot_limpar_ofs_italy_testes');
    await H('POST', '/api/_oneshot_limpar_ofs_orfas_100k');
    await new Promise(r => setTimeout(r, 1000));
  }
  process.exit(0);
})();
