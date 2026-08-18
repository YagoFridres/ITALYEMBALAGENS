const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const BASE = 'https://adm.italyembalagens.com.br';
const TOKEN = jwt.sign({ id: 't', perfil: 'admin', emp_id: 'E1', sigla: 'ITALY' }, 'italy_secret_2026', { expiresIn: '10h' });
const PAYLOAD_C1 = { cliente: 'MÓVEIS RIPKE', clinome: 'MOVEIS RIPKE', descricao: 'ZZZ_TESTE_APAGAR_V21', qtd: 10, data_entrega: '2026-12-31', preco: 50, vendedor: 'VENDEDOR PADRAO', vendedor_id: '00000000-0000-0000-0000-000000000001', itens: [], cli_id: 'be617df1-441a-4f11-918e-d813a5ac854c' };
const T = '20260812231000';
const OUT = '_V21_DBG.log';
fs.writeFileSync(OUT, '');
function L(s) { fs.appendFileSync(OUT, s + '\n'); console.log(s); }
function H(method, path, body) {
  return new Promise(res => {
    try {
      const u = new URL(BASE + path);
      const opts = { method, hostname: u.hostname, port: 443, path: u.pathname + u.search, timeout: 90000, headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json', 'Accept-Encoding': 'identity', 'Cache-Control': 'no-cache' } };
      const r = https.request(opts, rsp => { let d = ''; rsp.on('data', c => d += c); rsp.on('end', () => { let j = null; try { j = d ? JSON.parse(d) : null; } catch (e) { j = { _raw: d.slice(0, 2000) }; } res({ s: rsp.statusCode, j, raw0: d.slice(0, 5000) }); }); });
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
  // 1) Poll deploy
  let okDep = false; let i = 0; const end = Date.now() + 50 * 60 * 1000;
  while (Date.now() < end && !okDep) {
    i++;
    const a = await Rstatic('/sw.js'); const b = await Rstatic('/index.html'); const c = await Rstatic('/patch.js');
    okDep = a && b && c; L(`DEP i=${i} ok=${okDep} sw=${a} ix=${b} pt=${c}`);
    if (!okDep) await new Promise(r => setTimeout(r, 7000));
  }
  if (!okDep) { L('DEP_FAIL'); process.exit(2); }
  // 2) Limpeza 3x
  for (let k = 0; k < 3; k++) {
    const L1 = await H('POST', '/api/_oneshot_limpar_ofs_italy_testes');
    const L2 = await H('POST', '/api/_oneshot_limpar_ofs_orfas_100k');
    L(`LIMPEZA round=${k} italy=${JSON.stringify(L1.j || {}).slice(0, 120)} orfas=${JSON.stringify(L2.j || {}).slice(0, 120)}`);
    await new Promise(r => setTimeout(r, 1200));
  }
  // 3) DBG_FULL_POST — exatamente o mesmo payload de C1
  const DBG = await H('POST', '/api/_dbg_full_post_ofs', PAYLOAD_C1);
  const D = DBG.j?.DEBUG || {};
  L(`DBG_FULL: blocoEntrou=${D.blocoEntrou} nextSeq=${D.nextSeq} numeroEmpresa=${D.numeroEmpresa} sigla=${D.siglaLegadaEmp} escolhido=${D.escolhido} idx=${D.escolhidoIdx} calc_ok=${D.calcR?.ok} calc_prox=${D.calcR?.proximo} calc_maior=${D.calcR?.maior} calc_err=${D.calcR?.erro || ''} calcRErr=${D.calcRErr || ''} blocoErro=${D.blocoErro || ''}`);
  L(`DBG_FULL filteredBeforeOf: ${JSON.stringify(D.filteredBeforeOf)}`);
  for (const t of D.conflitoLog || []) {
    L(`  tent i=${t.i} cand=${t.cand} ms=${t.qMs || ''} qErr=${t.qErr || ''} err=${t.err || ''} conflita=${t.conflita} qRows=${Array.isArray(t.qEx) ? t.qEx.length : null}`);
    if (Array.isArray(t.qEx)) for (const r of t.qEx) L(`    row: ${JSON.stringify(r)}`);
  }
  L(`DBG_FULL filteredFinal: ${JSON.stringify(D.filteredFinal)}`);
  fs.writeFileSync('_DBG_FULL_V21.json', JSON.stringify(DBG.j, null, 2));
  // 4) Real POST /api/ofs C1
  const P1 = await H('POST', '/api/ofs', PAYLOAD_C1);
  const of = P1.j?.data?.[0] || P1.j?.data || P1.j;
  L(`POST_C1: s=${P1.s} numero=${of?.numero} of=${of?.of} of_num=${of?.of_num} seq=${of?.seq} id=${String(of?.id||'').slice(0,16)} err=${P1.j?.error || P1.j?.message || ''}`);
  fs.writeFileSync('_POST_C1_V21.json', JSON.stringify(P1.j || {}, null, 2));
  // 5) POST C2 exato nome
  const P2 = await H('POST', '/api/ofs', { ...PAYLOAD_C1, cli_id: undefined, cliente: 'MOVEIS RIPKE', clinome: 'MOVEIS RIPKE', descricao: 'ZZZ_TESTE_APAGAR_V21_C2' });
  const of2 = P2.j?.data?.[0] || P2.j?.data || P2.j;
  L(`POST_C2: s=${P2.s} numero=${of2?.numero} of=${of2?.of} err=${P2.j?.error || P2.j?.message || ''}`);
  // 6) POST C3 acento
  const P3 = await H('POST', '/api/ofs', { ...PAYLOAD_C1, cli_id: undefined, cliente: 'MÓVEIS RIPKE', clinome: 'MÓVEIS RIPKE', descricao: 'ZZZ_TESTE_APAGAR_V21_C3' });
  const of3 = P3.j?.data?.[0] || P3.j?.data || P3.j;
  L(`POST_C3: s=${P3.s} numero=${of3?.numero} of=${of3?.of} err=${P3.j?.error || P3.j?.message || ''}`);
  // 7) POST C4 sem acento minúsculas
  const P4 = await H('POST', '/api/ofs', { ...PAYLOAD_C1, cli_id: undefined, cliente: 'moveis ripke', clinome: 'moveis ripke', descricao: 'ZZZ_TESTE_APAGAR_V21_C4' });
  const of4 = P4.j?.data?.[0] || P4.j?.data || P4.j;
  L(`POST_C4: s=${P4.s} numero=${of4?.numero} of=${of4?.of} err=${P4.j?.error || P4.j?.message || ''}`);
  // 8) POST C5 ambiguidade
  const P5 = await H('POST', '/api/ofs', { ...PAYLOAD_C1, cli_id: undefined, cliente: 'moveis', clinome: 'moveis', descricao: 'ZZZ_TESTE_APAGAR_V21_C5' });
  L(`POST_C5: s=${P5.s} esperava=400 msg=${(P5.j?.error||'').slice(0,200)}`);
  // 9) POST C6 inexistente
  const P6 = await H('POST', '/api/ofs', { ...PAYLOAD_C1, cli_id: undefined, cliente: 'xablau cliente 9999 nao existe zzz', clinome: '', descricao: 'ZZZ_TESTE_APAGAR_V21_C6' });
  L(`POST_C6: s=${P6.s} esperava=400 msg=${(P6.j?.error||'').slice(0,200)}`);
  // 10) Limpeza final
  for (let k = 0; k < 2; k++) {
    await H('POST', '/api/_oneshot_limpar_ofs_italy_testes');
    await H('POST', '/api/_oneshot_limpar_ofs_orfas_100k');
    await new Promise(r => setTimeout(r, 1000));
  }
  const DF = await H('GET', '/api/_diag_proxnum');
  L(`PROXN_FINAL MAIOR=${DF.j?.res_por_resolver?.maior} PROXN=${DF.j?.res_por_resolver?.proximo}`);
  L('--- V21 OK ---');
  process.exit(0);
})();
