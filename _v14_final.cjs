const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const BASE = 'https://adm.italyembalagens.com.br';
const TOKEN = jwt.sign({ id: 't', perfil: 'admin', emp_id: 'E1', sigla: 'ITALY' }, 'italy_secret_2026', { expiresIn: '10h' });
const RIPKE_UUID_REAL = 'be617df1-441a-4f11-918e-d813a5ac854c';
const VEND_UUID = '00000000-0000-0000-0000-000000000001';
const OUT = '_V14_RESULT.jsonl';
const TARGET_VER = '20260812190000';
fs.writeFileSync(OUT, '');
function L(o) { const s = JSON.stringify(o); fs.appendFileSync(OUT, s + '\n'); console.log(s.length > 500 ? s.slice(0, 500) + '...' : s); }
function S(ms) { return new Promise(r => setTimeout(r, ms)); }
function R(method, path, body) {
  return new Promise(resolve => {
    try {
      const u = new URL(BASE + path);
      const opts = { method, hostname: u.hostname, port: 443, path: u.pathname + u.search, timeout: 60000, headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json', 'Accept-Encoding': 'identity' } };
      const r = https.request(opts, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { let j = null; try { j = d ? JSON.parse(d) : null; } catch (e) { j = {}; } resolve({ s: res.statusCode, j, raw0: d.slice(0, 1200) }); }); });
      r.on('error', e => resolve({ s: 0, j: null, err: String(e.message) })); r.on('timeout', () => { r.destroy(); resolve({ s: -1, j: null, err: 'timeout' }); });
      if (body) r.write(JSON.stringify(body)); r.end();
    } catch (e) { resolve({ s: -2, j: null, err: String(e.message) }); }
  });
}
function makeOf(ov = {}) {
  return Object.assign({ clinome: 'MOVEIS RIPKE', descricao: 'ZZZ_TESTE_APAGAR_V14', qtd: 10, ent: '2026-12-31', preco: 50, vendedor: 'VENDEDOR PADRAO', vendedor_id: VEND_UUID, itens: [] }, ov);
}
(async () => {
  try {
    for (let i = 0; i < 18; i++) {
      const idx = await R('GET', '/index.html'); const sw = await R('GET', '/sw.js');
      const iOk = String(idx.raw0 || '').includes(TARGET_VER); const sOk = String(sw.raw0 || '').includes(TARGET_VER);
      L({ t: 'POLL', i, iOk, sOk });
      if (iOk && sOk) break;
      await S(10000);
    }
    const emps = await R('GET', '/api/empresas');
    const lista = (emps.j?.ok && Array.isArray(emps.j.data)) ? emps.j.data : [];
    const italy = lista.find(e => String(e.codigo || e.sigla || '').toUpperCase() === 'E1') || lista.find(e => String(e.nome || '').toLowerCase().includes('italy')) || null;
    const EMP_REAL_UUID = italy?.id || null;
    L({ t: 'EMPRESAS', qtd: lista.length, ITALY_UUID_REAL: EMP_REAL_UUID });
    if (!EMP_REAL_UUID) process.exit(1);
    const osi = await R('POST', '/api/_oneshot_limpar_ofs_italy_testes', {});
    L({ t: 'ONESHOT_ITALY', total_analisado: osi.j?.total_analisado, total_alvos: osi.j?.total_alvos, atualizados: osi.j?.atualizados, detalhes5: (osi.j?.detalhes || []).slice(0, 5) });
    const oso = await R('POST', '/api/_oneshot_limpar_ofs_orfas_100k', {});
    L({ t: 'ONESHOT_ORFAS', atualizados: oso.j?.atualizados });
    await S(4000);
    const pn = await R('GET', '/api/ofs/proximo-numero?empId=' + EMP_REAL_UUID);
    const MAIOR_ESP = 2527; const PROXN_ESP = '2528';
    L({ t: 'PROXN_ANTES', esperado_proximo: PROXN_ESP, esperado_maior: MAIOR_ESP, recebido: pn.j, ok: pn.j && parseInt(String(pn.j.proximo || '0')) === parseInt(PROXN_ESP, 10) });
    const idsD = [];
    const casos = [];
    const baseEmp = { empresa_id: EMP_REAL_UUID, emp_id: 'E1' };
    async function runCaso(nome, payload, esperar200) {
      const r = await R('POST', '/api/ofs', payload);
      const ok = !!r.j?.ok;
      const passou = esperar200 ? ok : !ok;
      const obj = { t: nome, esperava_200: esperar200, salvou: ok, passou, s: r.s };
      if (ok) {
        obj.numero = r.j?.data?.numero || r.j?.numero;
        obj.clinome = r.j?.data?.clinome;
        obj.cli = String(r.j?.data?.cli_id || '').slice(0, 20) + '...';
        if (r.j?.data?.id) idsD.push(r.j.data.id);
      } else {
        obj.err = String(r.j?.error || r.raw0 || '').slice(0, 250);
        obj.ref = r.j?.ref || null;
        obj.qtd = r.j?.qtd || null;
      }
      L(obj);
      casos.push({ nome, passou });
    }
    await runCaso('C1_BASELINE_UUID', makeOf(Object.assign({ cli_id: RIPKE_UUID_REAL, descricao: 'ZZZ_TESTE_APAGAR_V14_C1_UUID' }, baseEmp)), true);
    const p2 = makeOf(Object.assign({ cli_id: 'MOVEIS RIPKE', descricao: 'ZZZ_TESTE_APAGAR_V14_C2_EXATO' }, baseEmp)); delete p2.clinome;
    await runCaso('C2_EXATO_NOME', p2, true);
    const p3 = makeOf(Object.assign({ cli_id: 'MÓVEIS RIPKE', descricao: 'ZZZ_TESTE_APAGAR_V14_C3_ACENTO' }, baseEmp)); delete p3.clinome;
    await runCaso('C3_COM_ACENTO', p3, true);
    const p4 = makeOf(Object.assign({ cli_id: 'moveis ripke', descricao: 'ZZZ_TESTE_APAGAR_V14_C4_MIN' }, baseEmp)); delete p4.clinome;
    await runCaso('C4_MIN_SEMACENTO', p4, true);
    const p5 = makeOf(Object.assign({ cli_id: 'moveis', descricao: 'ZZZ_TESTE_APAGAR_V14_C5_PARCIAL' }, baseEmp)); delete p5.clinome;
    await runCaso('C5_PARCIAL_AMBIGUO', p5, false);
    const p6 = makeOf(Object.assign({ cli_id: 'xablau cliente 9999 nao existe zzz', descricao: 'ZZZ_TESTE_APAGAR_V14_C6_INEX' }, baseEmp)); delete p6.clinome;
    await runCaso('C6_INEXISTENTE', p6, false);
    const dels = [];
    for (const id of idsD) { const d = await R('DELETE', '/api/ofs/' + id); dels.push({ id: String(id).slice(0, 20), s: d.s, ok: !!d.j?.ok }); await S(350); }
    L({ t: 'LIMPEZA_FINAL_TESTES', qtd: idsD.length, dels });
    await S(6000);
    const osi2 = await R('POST', '/api/_oneshot_limpar_ofs_italy_testes', {});
    L({ t: 'ONESHOT_ITALY_FINAL', atualizados: osi2.j?.atualizados });
    const oso2 = await R('POST', '/api/_oneshot_limpar_ofs_orfas_100k', {});
    L({ t: 'ONESHOT_ORFAS_FINAL', atualizados: oso2.j?.atualizados });
    await S(4000);
    const pnF = await R('GET', '/api/ofs/proximo-numero?empId=' + EMP_REAL_UUID);
    L({ t: 'PROXN_FINAL', esperado_proximo: PROXN_ESP, recebido: pnF.j, ok: pnF.j && parseInt(String(pnF.j.proximo || '0')) === parseInt(PROXN_ESP, 10) });
    const okT = casos.filter(c => c.passou).length;
    L({ t: 'RESUMO', total: casos.length, passaram: okT, pct: Math.round(100 * okT / casos.length) + '%', lista: casos });
    process.exit(0);
  } catch (e) {
    L({ t: 'ERR', msg: String(e), st: String(e.stack || '').slice(0, 1000) });
    process.exit(1);
  }
})();
