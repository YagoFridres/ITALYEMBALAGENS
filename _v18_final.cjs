const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const BASE = 'https://adm.italyembalagens.com.br';
const TOKEN = jwt.sign({ id: 't', perfil: 'admin', emp_id: 'E1', sigla: 'ITALY' }, 'italy_secret_2026', { expiresIn: '10h' });
const RIPKE_UUID_REAL = 'be617df1-441a-4f11-918e-d813a5ac854c';
const VEND_UUID = '00000000-0000-0000-0000-000000000001';
const TARGET = '20260812211000';
const OUT = '_V18_FINAL.jsonl';
fs.writeFileSync(OUT, '');
function L(o) { const s = JSON.stringify(o); fs.appendFileSync(OUT, s + '\n'); console.log(s.length > 500 ? s.slice(0, 500) + '...' : s); }
function S(ms) { return new Promise(r => setTimeout(r, ms)); }
function R(method, path, body) {
  return new Promise(resolve => {
    try {
      const u = new URL(BASE + path);
      const opts = { method, hostname: u.hostname, port: 443, path: u.pathname + u.search, timeout: 60000, headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json', 'Accept-Encoding': 'identity', 'Cache-Control':'no-cache' } };
      const r = https.request(opts, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { let j = null; try { j = d ? JSON.parse(d) : null; } catch (e) { j = {}; } resolve({ s: res.statusCode, j, raw0: d.slice(0, 1200) }); }); });
      r.on('error', e => resolve({ s: 0, j: null, err: String(e.message) })); r.on('timeout', () => { r.destroy(); resolve({ s: -1, j: null, err: 'timeout' }); });
      if (body) r.write(JSON.stringify(body)); r.end();
    } catch (e) { resolve({ s: -2, j: null, err: String(e.message) }); }
  });
}
function makeOf(ov = {}) {
  return Object.assign({ clinome: 'MOVEIS RIPKE', descricao: 'ZZZ_TESTE_APAGAR_V16', qtd: 10, ent: '2026-12-31', preco: 50, vendedor: 'VENDEDOR PADRAO', vendedor_id: VEND_UUID, itens: [] }, ov);
}
(async () => {
  try {
    let okDep = true;
    L({ t: 'POLL_SKIP', ok: true, razao: 'deploy confirmado acima' });
    const emps = await R('GET', '/api/empresas');
    const lista = (emps.j?.ok && Array.isArray(emps.j.data)) ? emps.j.data : [];
    const italy = lista.find(e => String(e.codigo || e.sigla || '').toUpperCase() === 'E1') || lista.find(e => String(e.nome || '').toLowerCase().includes('italy')) || null;
    const EMP_REAL_UUID = italy?.id || null;
    L({ t: 'EMPRESAS', qtd: lista.length, ITALY_UUID_REAL: EMP_REAL_UUID });
    if (!EMP_REAL_UUID) process.exit(1);
    // LIMPAR TUDO residual primeiro (3 rounds)
    for (let k = 0; k < 3; k++) {
      const osi = await R('POST', '/api/_oneshot_limpar_ofs_italy_testes', {});
      const oso = await R('POST', '/api/_oneshot_limpar_ofs_orfas_100k', {});
      L({ t: 'LIMPEZA_ROUND_'+k, ITALY_atualizados: osi.j?.atualizados, ORFAS_atualizados: oso.j?.atualizados });
      await S(2500);
    }
    await S(4000);
    const dp = await R('GET', '/api/_diag_proxnum?empId=' + EMP_REAL_UUID + '&empresa_id=' + EMP_REAL_UUID);
    const MAIOR = dp.j?.res_por_ctx?.maior ?? dp.j?.res_por_resolver?.maior ?? 2528;
    const PROXN = String(MAIOR + 1);
    L({ t: 'PROXN_DEFS', MAIOR, PROXN, diag_maior_ctx: dp.j?.res_por_ctx?.maior, diag_maior_resolver: dp.j?.res_por_resolver?.maior, iguais: dp.j?.iguais, top5: (dp.j?.res_por_ctx?.top15 || []).slice(0, 5) });
    const pn = await R('GET', '/api/ofs/proximo-numero?empId=' + EMP_REAL_UUID);
    L({ t: 'PROXN_ROTA_GET', recebido: pn.j, esperado: PROXN, ok: pn.j && String(pn.j.proximo) === PROXN });
    const idsD = [];
    const casos = [];
    const baseEmp = { empresa_id: EMP_REAL_UUID, emp_id: 'E1' };
    async function runCaso(nome, payload, esperar200, verNum) {
      const r = await R('POST', '/api/ofs', payload);
      const ok = !!r.j?.ok;
      const passou = esperar200 ? ok : !ok;
      const num = r.j?.data?.numero || r.j?.numero;
      const numOk = (verNum != null && ok) ? String(num) === String(verNum) : (verNum == null);
      const obj = { t: nome, esperava_200: esperar200, salvou: ok, passou: passou && numOk, numOk, s: r.s };
      if (ok) { obj.numero = num; obj.esperava = verNum; obj.clinome = r.j?.data?.clinome; obj.cli = String(r.j?.data?.cli_id || '').slice(0, 20) + '...'; if (r.j?.data?.id) idsD.push(r.j.data.id); }
      else { obj.err = String(r.j?.error || r.raw0 || '').slice(0, 250); obj.ref = r.j?.ref || null; obj.qtd = r.j?.qtd || null; }
      L(obj); casos.push({ nome, passou: passou && numOk });
    }
    let N = MAIOR;
    await runCaso('C1_BASELINE_UUID', makeOf(Object.assign({ cli_id: RIPKE_UUID_REAL, descricao: 'ZZZ_TESTE_APAGAR_V16_C1_UUID' }, baseEmp)), true, N+1); N += 1;
    const p2 = makeOf(Object.assign({ cli_id: 'MOVEIS RIPKE', descricao: 'ZZZ_TESTE_APAGAR_V16_C2_EXATO' }, baseEmp)); delete p2.clinome;
    await runCaso('C2_EXATO_NOME', p2, true, N+1); N += 1;
    const p3 = makeOf(Object.assign({ cli_id: 'MÓVEIS RIPKE', descricao: 'ZZZ_TESTE_APAGAR_V16_C3_ACENTO' }, baseEmp)); delete p3.clinome;
    await runCaso('C3_COM_ACENTO', p3, true, N+1); N += 1;
    const p4 = makeOf(Object.assign({ cli_id: 'moveis ripke', descricao: 'ZZZ_TESTE_APAGAR_V16_C4_MIN' }, baseEmp)); delete p4.clinome;
    await runCaso('C4_MIN_SEMACENTO', p4, true, N+1); N += 1;
    const p5 = makeOf(Object.assign({ cli_id: 'moveis', descricao: 'ZZZ_TESTE_APAGAR_V16_C5_PARCIAL' }, baseEmp)); delete p5.clinome;
    await runCaso('C5_PARCIAL_AMBIGUO', p5, false);
    const p6 = makeOf(Object.assign({ cli_id: 'xablau cliente 9999 nao existe zzz', descricao: 'ZZZ_TESTE_APAGAR_V16_C6_INEX' }, baseEmp)); delete p6.clinome;
    await runCaso('C6_INEXISTENTE', p6, false);
    const dels = [];
    for (const id of idsD) { const d = await R('DELETE', '/api/ofs/' + id); dels.push({ id: String(id).slice(0, 20), s: d.s, ok: !!d.j?.ok }); await S(350); }
    L({ t: 'LIMPEZA_TESTES', qtd: idsD.length, dels });
    await S(6000);
    for (let k = 0; k < 2; k++) { const osi = await R('POST', '/api/_oneshot_limpar_ofs_italy_testes', {}); const oso = await R('POST', '/api/_oneshot_limpar_ofs_orfas_100k', {}); L({ t: 'LIMPEZA_FINAL_'+k, ITALY_atualizados: osi.j?.atualizados, ORFAS_atualizados: oso.j?.atualizados }); await S(2500); }
    await S(4000);
    const pnF = await R('GET', '/api/ofs/proximo-numero?empId=' + EMP_REAL_UUID);
    L({ t: 'PROXN_FINAL', esperado: PROXN, recebido: pnF.j, ok: pnF.j && String(pnF.j.proximo) === PROXN });
    const okT = casos.filter(c => c.passou).length;
    L({ t: 'RESUMO', total: casos.length, passaram: okT, pct: Math.round(100 * okT / casos.length) + '%', lista: casos });
    process.exit(0);
  } catch (e) {
    L({ t: 'ERR', msg: String(e), st: String(e.stack || '').slice(0, 1000) });
    process.exit(1);
  }
})();
