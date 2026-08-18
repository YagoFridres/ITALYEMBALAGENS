const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const BASE = 'https://adm.italyembalagens.com.br';
const TOKEN = jwt.sign({ id: 't', perfil: 'admin', emp_id: 'E1', sigla: 'ITALY' }, 'italy_secret_2026', { expiresIn: '10h' });
const RIPKE_UUID_REAL = 'be617df1-441a-4f11-918e-f681b8d0a9e6';
const VEND_UUID = '00000000-0000-0000-0000-000000000001';
const OUT = '_V6_RESULT.jsonl';
fs.writeFileSync(OUT, '');
function L(o) { const s = JSON.stringify(o); fs.appendFileSync(OUT, s + '\n'); console.log(s.length > 500 ? s.slice(0, 500) + '...' : s); }
function S(ms) { return new Promise(r => setTimeout(r, ms)); }
function R(method, path, body) {
  return new Promise(resolve => {
    try {
      const u = new URL(BASE + path);
      const opts = { method, hostname: u.hostname, port: 443, path: u.pathname + u.search, timeout: 45000, headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' } };
      const r = https.request(opts, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { let j = null; try { j = d ? JSON.parse(d) : null; } catch (e) { j = { _raw: d.slice(0, 500) }; } resolve({ s: res.statusCode, j, raw0: d.slice(0, 1200) }); }); });
      r.on('error', e => resolve({ s: 0, j: null, err: String(e.message) })); r.on('timeout', () => { r.destroy(); resolve({ s: -1, j: null, err: 'timeout' }); });
      if (body) r.write(JSON.stringify(body)); r.end();
    } catch (e) { resolve({ s: -2, j: null, err: String(e.message) }); }
  });
}
function makeOf(ov = {}) {
  return Object.assign({ clinome: 'MOVEIS RIPKE', descricao: 'ZZZ_TESTE_APAGAR_V6', qtd: 10, ent: '2026-12-31', preco: 50, vendedor: 'VENDEDOR PADRAO', vendedor_id: VEND_UUID, itens: [] }, ov);
}

(async () => {
  try {
    // 1) Empresa ITALY UUID real
    const emps = await R('GET', '/api/empresas');
    const lista = (emps.j?.ok && Array.isArray(emps.j.data)) ? emps.j.data : [];
    const italy = lista.find(e => String(e.codigo || e.sigla || '').toUpperCase() === 'E1') || lista.find(e => String(e.nome || '').toLowerCase().includes('italy')) || null;
    const EMP_REAL_UUID = italy?.id || null;
    L({ t: 'EMPRESAS', qtd: lista.length, ITALY_UUID_REAL: EMP_REAL_UUID, ITALY_sigla: italy?.sigla, ITALY_codigo: italy?.codigo });
    if (!EMP_REAL_UUID) { L({ t: 'FAIL_SEM_ITALY' }); process.exit(1); }

    // 2) Limpar OFs residuais 100k+ DA EMPRESA ITALY (nao orfas)
    const all100k = await R('GET', '/api/ofs?limit=500&empId=' + EMP_REAL_UUID);
    const arrAll = Array.isArray(all100k.j?.data) ? all100k.j.data : (Array.isArray(all100k.j) ? all100k.j : []);
    const numAlvos = arrAll.filter(o => !o.deleted_at && (parseInt(String(o.numero || '0')) >= 100000 || (String(o.descricao || '').includes('ZZZ_TESTE_APAGAR'))));
    const dels1 = [];
    for (const o of numAlvos) { const d = await R('DELETE', '/api/ofs/' + o.id); dels1.push({ id: o.id, num: o.numero, s: d.s, ok: !!d.j?.ok }); await S(250); }
    L({ t: 'LIMPEZA_REIDUAIS_100K_ITALY', qtd_analisado: arrAll.length, qtd_alvos: numAlvos.length, dels: dels1 });

    // 3) Oneshot orfas
    const os = await R('POST', '/api/_oneshot_limpar_ofs_orfas_100k', {});
    L({ t: 'ONESHOT_ORFAS', s: os.s, j: os.j ? JSON.stringify(os.j).slice(0, 500) : null });
    await S(3000);

    // 4) ProxNum
    const pn = await R('GET', '/api/ofs/proximo-numero?empId=' + EMP_REAL_UUID);
    const ok2605 = pn.j && parseInt(String(pn.j.proximo || '0')) === 2605;
    L({ t: 'PROXN_2605_ANTES', ok: ok2605, resp: pn.j });

    // Casos
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
        obj.cli = (r.j?.data?.cli_id || '').slice(0, 15) + '...';
        if (r.j?.data?.id) idsD.push(r.j.data.id);
      } else {
        obj.err = String(r.j?.error || r.raw0 || '').slice(0, 220);
        obj.ref = r.j?.ref || null;
        obj.qtd = r.j?.qtd || null;
      }
      L(obj);
      casos.push({ nome, passou });
    }
    // C1 Baseline UUID CORRETO
    await runCaso('C1_BASELINE_UUID', makeOf(Object.assign({ cli_id: RIPKE_UUID_REAL, descricao: 'ZZZ_TESTE_APAGAR_V6_C1_UUID' }, baseEmp)), true);
    // C2 Exato nome
    const p2 = makeOf(Object.assign({ cli_id: 'MOVEIS RIPKE', descricao: 'ZZZ_TESTE_APAGAR_V6_C2_EXATO' }, baseEmp));
    delete p2.clinome;
    await runCaso('C2_EXATO_NOME', p2, true);
    // C3 Acento
    const p3 = makeOf(Object.assign({ cli_id: 'MÓVEIS RIPKE', descricao: 'ZZZ_TESTE_APAGAR_V6_C3_ACENTO' }, baseEmp));
    delete p3.clinome;
    await runCaso('C3_COM_ACENTO', p3, true);
    // C4 minusculo sem acento
    const p4 = makeOf(Object.assign({ cli_id: 'moveis ripke', descricao: 'ZZZ_TESTE_APAGAR_V6_C4_MIN' }, baseEmp));
    delete p4.clinome;
    await runCaso('C4_MIN_SEMACENTO', p4, true);
    // C5 Parcial (ambíguo: moveis ADENAU + moveis RIPKE)
    const p5 = makeOf(Object.assign({ cli_id: 'moveis', descricao: 'ZZZ_TESTE_APAGAR_V6_C5_PARCIAL' }, baseEmp));
    delete p5.clinome;
    await runCaso('C5_PARCIAL_AMBIGUO', p5, false);
    // C6 Inexistente
    const p6 = makeOf(Object.assign({ cli_id: 'xablau cliente 9999 nao existe zzz', descricao: 'ZZZ_TESTE_APAGAR_V6_C6_INEX' }, baseEmp));
    delete p6.clinome;
    await runCaso('C6_INEXISTENTE', p6, false);
    // C7: nome SEM cli_id pré-set mas com clinome=MÓVEIS RIPKE
    const p7 = makeOf(Object.assign({ descricao: 'ZZZ_TESTE_APAGAR_V6_C7_CLINOME' }, baseEmp));
    await runCaso('C7_CLINOME_NORMAL', p7, true);

    // Limpeza das OFs criadas
    const dels2 = [];
    for (const id of idsD) { const d = await R('DELETE', '/api/ofs/' + id); dels2.push({ id: id, s: d.s, ok: !!d.j?.ok }); await S(250); }
    L({ t: 'LIMPEZA_FINAL_TESTES', qtd: idsD.length, dels: dels2 });
    await S(2000);

    // ProxNum final
    const pnF = await R('GET', '/api/ofs/proximo-numero?empId=' + EMP_REAL_UUID);
    L({ t: 'PROXN_FINAL_2605', ok: pnF.j && parseInt(String(pnF.j.proximo || '0')) === 2605, resp: pnF.j });

    // Resumo
    const okT = casos.filter(c => c.passou).length;
    L({ t: 'RESUMO', total: casos.length, passaram: okT, pct: Math.round(100 * okT / casos.length) + '%', lista: casos });
    process.exit(0);
  } catch (e) {
    L({ t: 'ERR', msg: String(e), st: String(e.stack || '').slice(0, 400) });
    process.exit(1);
  }
})();
