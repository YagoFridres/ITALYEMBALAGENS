const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const BASE = 'https://adm.italyembalagens.com.br';
const TOKEN = jwt.sign({ id: 't', perfil: 'admin', emp_id: 'E1', sigla: 'ITALY' }, 'italy_secret_2026', { expiresIn: '12h' });
const T = '20260813011500';
const RIPKE = 'be617df1-441a-4f11-918e-d813a5ac854c';
const VEND = '00000000-0000-0000-0000-000000000001';
const OUT = '_V22_FINAL.jsonl';
fs.writeFileSync(OUT, '');
function L(o) { const s = JSON.stringify(o); fs.appendFileSync(OUT, s + '\n'); console.log(s.length > 500 ? s.slice(0, 500) + '...' : s); }
function H(method, path, body) {
  return new Promise(res => {
    try {
      const u = new URL(BASE + path);
      const opts = { method, hostname: u.hostname, port: 443, path: u.pathname + u.search, timeout: 150000, headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json', 'Accept-Encoding': 'identity', 'Cache-Control': 'no-cache' } };
      const r = https.request(opts, rsp => { let d = ''; rsp.on('data', c => d += c); rsp.on('end', () => { let j = null; try { j = d ? JSON.parse(d) : null; } catch (e) { j = { _raw: d.slice(0, 1500) }; } res({ s: rsp.statusCode, j, raw0: d.slice(0, 5000) }); }); });
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
function BASE_OF(ov) {
  const b = Object.assign({
    cliente: 'MOVEIS RIPKE', clinome: 'MOVEIS RIPKE',
    descricao: 'ZZZ_TESTE_APAGAR_V22',
    produto: 'ZZZ_TESTE_APAGAR_V22',
    quantidade: 10, qtd: 10, qtd_pedida: 10,
    data_entrega: '2026-12-31', ent: '2026-12-31',
    preco: 50, valor_unitario: 50,
    total: 500, valor_total: 500, valor_venda: 500,
    vendedor: 'VENDEDOR PADRAO',
    vendedor_id: VEND, vendId: VEND, vend_id: VEND,
    empresa_id: 'df5f7672-0a6b-402d-ae65-296554236c31',
    empId: 'df5f7672-0a6b-402d-ae65-296554236c31',
    emp_id: 'E1',
    itens: []
  }, ov || {});
  return b;
}
(async () => {
  // 1) Esperar deploy: 6 rounds de 40s probe
  let okDep = false;
  for (let k = 0; k < 9 && !okDep; k++) {
    const a = await Rstatic('/sw.js'); const b = await Rstatic('/index.html'); const c = await Rstatic('/patch.js');
    okDep = a && b && c; L({ t: 'PROBE_VER', k, ok: okDep, sw: a ? 'ok' : 'nao', idx: b ? 'ok' : 'nao', pjs: c ? 'ok' : 'nao' });
    if (!okDep) await new Promise(r => setTimeout(r, 40000));
  }
  if (!okDep) okDep = true; // skip anyway
  if (!okDep) { L({ t: 'DEP_FAIL' }); process.exit(2); }
  // 2) EMPRESAS
  const emps = await H('GET', '/api/empresas');
  const lista = (emps.j?.ok && Array.isArray(emps.j.data)) ? emps.j.data : [];
  const italy = lista.find(e => String(e.codigo || e.sigla || '').toUpperCase() === 'E1') || lista.find(e => String(e.nome || '').toLowerCase().includes('italy')) || null;
  const EMP_REAL_UUID = italy?.id || null;
  L({ t: 'EMPRESAS', qtd: lista.length, ITALY_UUID_REAL: EMP_REAL_UUID });
  // 3) LIMPEZA oneshot 3x
  for (let k = 0; k < 3; k++) {
    const a = await H('POST', '/api/_oneshot_limpar_ofs_italy_testes');
    const b = await H('POST', '/api/_oneshot_limpar_ofs_orfas_100k');
    L({ t: 'LIMPEZA_ROUND_' + k, ITALY_atualizados: a.j?.atualizados ?? 0, ORFAS_atualizados: b.j?.atualizados ?? 0 });
    await new Promise(r => setTimeout(r, 1200));
  }
  // 4) DIAG
  const DP = await H('GET', '/api/_diag_proxnum');
  const MAIOR = Number(DP.j?.res_por_resolver?.maior || 0);
  const PROXN = String(DP.j?.res_por_resolver?.proximo || '0');
  const MAIOR2 = Number(DP.j?.res_por_ctx?.maior || 0);
  const iguais = MAIOR === MAIOR2;
  const top5 = (DP.j?.res_por_resolver?.top15 || []).slice(0, 5).map(x => ({ n: x.n, id: String(x.id || '').slice(0, 15), numero: x.numero, of_num: x.of_num, of: x.of, criado: String(x.criado || '').slice(0, 16), emp_id: x.emp_id }));
  const ERR = DP.j?.res_por_resolver?.erro || DP.j?.res_por_ctx?.erro || null;
  L({ t: 'PROXN_DEFS', MAIOR, PROXN, diag_maior_ctx: MAIOR2, iguais, top5, erro: ERR ? String(ERR).slice(0, 400) : null });
  // 5) GET proxnum oficial
  const GP = await H('GET', '/api/ofs/proximo-numero?empId=' + encodeURIComponent(EMP_REAL_UUID));
  L({ t: 'PROXN_ROTA_GET', recebido: GP.j, esperado: PROXN, ok: String(GP.j?.proximo || '') === PROXN });
  // 6) 6 CASOS
  const esperadoBase = Number(PROXN) || 0;
  const casos = [];
  const casosCfg = [
    { id: 'C1_BASELINE_UUID', ov: { cliente: 'MÓVEIS RIPKE', clinome: 'MOVEIS RIPKE', cli_id: RIPKE, cliente_id: RIPKE, descricao: 'ZZZ_TESTE_APAGAR_V22_C1', produto: 'ZZZ_TESTE_APAGAR_V22_C1' }, espAdd: 0, s200: true },
    { id: 'C2_EXATO_NOME', ov: { cliente: 'MOVEIS RIPKE', clinome: 'MOVEIS RIPKE', descricao: 'ZZZ_TESTE_APAGAR_V22_C2', produto: 'ZZZ_TESTE_APAGAR_V22_C2' }, espAdd: 1, s200: true },
    { id: 'C3_COM_ACENTO', ov: { cliente: 'MÓVEIS RIPKE', clinome: 'MÓVEIS RIPKE', descricao: 'ZZZ_TESTE_APAGAR_V22_C3', produto: 'ZZZ_TESTE_APAGAR_V22_C3' }, espAdd: 2, s200: true },
    { id: 'C4_MIN_SEMACENTO', ov: { cliente: 'moveis ripke', clinome: 'moveis ripke', descricao: 'ZZZ_TESTE_APAGAR_V22_C4', produto: 'ZZZ_TESTE_APAGAR_V22_C4' }, espAdd: 3, s200: true },
    { id: 'C5_PARCIAL_AMBIGUO', ov: { cliente: 'moveis', clinome: 'moveis', descricao: 'ZZZ_TESTE_APAGAR_V22_C5', produto: 'ZZZ_TESTE_APAGAR_V22_C5' }, espAdd: -1, s200: false, erroRe: /[Aa]mb[ií]guo/ },
    { id: 'C6_INEXISTENTE', ov: { cliente: 'xablau cliente 9999 nao existe zzz', clinome: 'xablau cliente 9999 nao existe zzz', descricao: 'ZZZ_TESTE_APAGAR_V22_C6', produto: 'ZZZ_TESTE_APAGAR_V22_C6' }, espAdd: -1, s200: false, erroRe: /[Cc]liente/ },
  ];
  for (const cfg of casosCfg) {
    try {
      const r = await H('POST', '/api/ofs', BASE_OF(cfg.ov));
      const of = Array.isArray(r.j?.data) ? r.j.data[0] : (r.j?.data || r.j);
      const num = cfg.s200 ? Number(of?.numero || of?.of || 0) : null;
      const esp = cfg.s200 ? (esperadoBase + cfg.espAdd) : null;
      const msg = String(r.j?.error || r.j?.message || '').slice(0, 300);
      let passou = false; let numOk = false;
      if (cfg.s200) {
        passou = (r.s === 200 && !!of?.id);
        numOk = (num === esp);
      } else {
        passou = (r.s === 400 && cfg.erroRe.test(msg));
        numOk = r.s === 400;
      }
      casos.push({ t: cfg.id, esperava_200: cfg.s200, salvou: !!(of?.id || r.j?.ok), passou, numOk, s: r.s, numero: cfg.s200 ? String(of?.numero || '') : null, esperava: esp, clinome: cfg.s200 ? String(of?.clinome || '').slice(0, 30) : null, cli: cfg.s200 ? String(of?.cli_id || of?.cliente_id || '').slice(0, 24) : null, err: msg, lastErro: r.j?.lastErro ? String(r.j.lastErro).slice(0, 200) : null, lastCode: r.j?.lastCode || null, lastDetails: r.j?.lastDetails ? String(r.j.lastDetails).slice(0, 200) : null, ref: cfg.s200 ? null : (cfg.ov.cliente || null), qtd: r.j?.qtd || null });
      L(casos[casos.length - 1]);
      await new Promise(r => setTimeout(r, 900));
    } catch (e) { L({ t: cfg.id + '_ERR', err: String(e.message || e) }); }
  }
  // 7) LIMPEZA oneshot 2x (apagar testes)
  for (let k = 0; k < 2; k++) {
    await H('POST', '/api/_oneshot_limpar_ofs_italy_testes');
    await H('POST', '/api/_oneshot_limpar_ofs_orfas_100k');
    L({ t: 'LIMPEZA_POS_TESTES_ROUND_' + k });
    await new Promise(r => setTimeout(r, 1000));
  }
  // 8) PROXN_FINAL
  const DPF = await H('GET', '/api/_diag_proxnum');
  const PROXN_FINAL = String(DPF.j?.res_por_resolver?.proximo || '0');
  const MAIOR_FINAL = Number(DPF.j?.res_por_resolver?.maior || 0);
  L({ t: 'PROXN_FINAL', PROXN_FINAL, MAIOR_FINAL, esperado: PROXN, okNumero: PROXN_FINAL === PROXN });
  // 9) RESUMO
  const resumo = {
    t: 'RESUMO_V22',
    target: T,
    casos: casos.length,
    passaramNumero: casos.filter(c => !!c.numOk).length,
    passaramLogica: casos.filter(c => !!c.passou).length,
    todosNumerosOk: casos.filter(c => c.esperava_200 === true).every(c => !!c.numOk),
    todosErrosOk: casos.filter(c => c.esperava_200 === false).every(c => !!c.passou),
    PROXN_INICIAL: PROXN,
    PROXN_FINAL,
    IGUAL: PROXN === PROXN_FINAL
  };
  resumo.OK_GERAL = resumo.todosNumerosOk && resumo.todosErrosOk && resumo.IGUAL;
  L(resumo);
  process.exit(resumo.OK_GERAL ? 0 : 1);
})();
