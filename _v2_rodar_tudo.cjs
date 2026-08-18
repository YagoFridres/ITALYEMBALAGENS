const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const BASE = 'https://adm.italyembalagens.com.br';
const TOKEN = jwt.sign({ id: 't', perfil: 'admin' }, 'italy_secret_2026', { expiresIn: '10h' });
const EMP_UUID = 'df5f7672-798e-4a6e-9393-3d46ed2d0d1f';
const RIPKE_UUID = 'be617df1-441a-470b-b9f3-f681b8d0a9e6';
const VEND_UUID = '00000000-0000-0000-0000-000000000001';
const OUT = '_V2_RES.jsonl';
fs.writeFileSync(OUT, '');
function L(o) { fs.appendFileSync(OUT, JSON.stringify(o) + '\n'); const s = JSON.stringify(o); console.log(s.length > 600 ? s.slice(0, 600) + '...' : s); }
function S(ms) { return new Promise(r => setTimeout(r, ms)); }
function R(method, path, body = null) {
  return new Promise(resolve => {
    try {
      const u = new URL(BASE + path);
      const opts = {
        method, hostname: u.hostname, port: 443, path: u.pathname + u.search,
        timeout: 40000, headers: {
          'Authorization': 'Bearer ' + TOKEN,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      const r = https.request(opts, res => {
        let d = ''; res.on('data', c => d += c); res.on('end', () => {
          let j = null; try { j = d ? JSON.parse(d) : null; } catch (e) { j = { _raw: d.slice(0, 500) }; }
          resolve({ s: res.statusCode, j, raw: d.slice(0, 2000) });
        });
      });
      r.on('timeout', () => { r.destroy(); resolve({ s: -1, j: null, err: 'timeout' }); });
      r.on('error', e => resolve({ s: 0, j: null, err: String(e.message || e) }));
      if (body) r.write(JSON.stringify(body)); r.end();
    } catch (e) { resolve({ s: -2, j: null, err: String(e.message || e) }); }
  });
}
function makeOf(ov = {}) {
  return {
    clinome: 'MOVEIS RIPKE', descricao: 'ZZZ_TESTE_APAGAR_V2',
    qtd: 10, ent: '2026-12-31', preco: 50,
    vendedor: 'VENDEDOR PADRAO', vendedor_id: VEND_UUID,
    empresa_id: EMP_UUID, emp_id: 'E1', itens: [], ...ov
  };
}
(async () => {
  try {
    L({ t: 'INI' });
    // 1) ONESHOT
    const os = await R('POST', '/api/_oneshot_limpar_ofs_orfas_100k', {});
    L({ t: 'ONESHOT', s: os.s, ok: !!os.j?.ok, e: os.j?.error || null, ta: os.j?.total_analisado, talv: os.j?.total_alvos, atu: os.j?.atualizados, f: os.j?.falhas, det: (os.j?.detalhes || []).slice(0, 12).map(x => ({ n: x.numero, c: x.clinome, d: x.desc, emp: x.empresa_id ? 'Tem' : 'NULO' })) });
    await S(1500);
    // 2) Prox num por empresa
    for (const sigla of [['E1', 'ITALY', EMP_UUID]]) {
      const p = await R('GET', '/api/ofs/proximo-numero?empId=' + EMP_UUID);
      L({ t: 'PROXN_' + sigla[0], resp: p.j, s: p.s, esperado: 2605, OK: p.j && parseInt(String(p.j.proximo || 0)) === 2605 });
    }
    const idsD = [];
    let p = 0, t = 0;

    // C1 Baseline
    t++;
    const r1 = await R('POST', '/api/ofs', makeOf({ cli_id: RIPKE_UUID, descricao: 'ZZZ_TESTE_APAGAR_V2_C1_BASELINE' }));
    const ok1 = !!r1.j?.ok; if (ok1) p++;
    L({ t: 'C1_BASELINE_UUID', s: r1.s, ok: ok1, num: r1.j?.data?.numero || r1.j?.numero, clinome: r1.j?.data?.clinome, e: r1.j?.error, ref: r1.j?.ref || null });
    if (r1.j?.data?.id) idsD.push(r1.j.data.id);

    // C2 Exato nome MOVEIS RIPKE
    t++;
    const pl2 = makeOf({ cli_id: 'MOVEIS RIPKE', descricao: 'ZZZ_TESTE_APAGAR_V2_C2_EXATO' }); delete pl2.clinome;
    const r2 = await R('POST', '/api/ofs', pl2);
    const ok2 = !!r2.j?.ok; if (ok2) p++;
    L({ t: 'C2_EXATO_NOME', s: r2.s, ok: ok2, num: r2.j?.data?.numero || r2.j?.numero, clinome: r2.j?.data?.clinome, e: r2.j?.error, ref: r2.j?.ref || null });
    if (r2.j?.data?.id) idsD.push(r2.j.data.id);

    // C3 Acento MÓVEIS RIPKE
    t++;
    const pl3 = makeOf({ cli_id: 'MÓVEIS RIPKE', descricao: 'ZZZ_TESTE_APAGAR_V2_C3_ACENTO' }); delete pl3.clinome;
    const r3 = await R('POST', '/api/ofs', pl3);
    const ok3 = !!r3.j?.ok; if (ok3) p++;
    L({ t: 'C3_COM_ACENTO', s: r3.s, ok: ok3, num: r3.j?.data?.numero || r3.j?.numero, clinome: r3.j?.data?.clinome, e: r3.j?.error, ref: r3.j?.ref || null });
    if (r3.j?.data?.id) idsD.push(r3.j.data.id);

    // C4 minusculo sem acento
    t++;
    const pl4 = makeOf({ cli_id: 'moveis ripke', descricao: 'ZZZ_TESTE_APAGAR_V2_C4_MIN' }); delete pl4.clinome;
    const r4 = await R('POST', '/api/ofs', pl4);
    const ok4 = !!r4.j?.ok; if (ok4) p++;
    L({ t: 'C4_MIN_SEMACENTO', s: r4.s, ok: ok4, num: r4.j?.data?.numero || r4.j?.numero, clinome: r4.j?.data?.clinome, e: r4.j?.error, ref: r4.j?.ref || null });
    if (r4.j?.data?.id) idsD.push(r4.j.data.id);

    // C5 Parcial ambíguo
    t++;
    const pl5 = makeOf({ cli_id: 'moveis', descricao: 'ZZZ_TESTE_APAGAR_V2_C5_AMBIG' }); delete pl5.clinome;
    const r5 = await R('POST', '/api/ofs', pl5);
    const ok5 = (r5.s === 400 && !r5.j?.ok && /mbiguo|selecione|cliente/i.test(String(r5.j?.error || '')));
    if (ok5) p++;
    L({ t: 'C5_PARCIAL_AMBIGUO', s: r5.s, ok: ok5, salvou: !!r5.j?.ok, e: String(r5.j?.error || '').slice(0, 200), qtd: r5.j?.qtd || 0 });
    if (r5.j?.data?.id) idsD.push(r5.j.data.id);

    // C6 Inexistente
    t++;
    const pl6 = makeOf({ cli_id: 'xablau cliente inexistente 9999 zzz', descricao: 'ZZZ_TESTE_APAGAR_V2_C6_INEX' }); delete pl6.clinome;
    const r6 = await R('POST', '/api/ofs', pl6);
    const ok6 = (r6.s === 400 && !r6.j?.ok);
    if (ok6) p++;
    L({ t: 'C6_INEXISTENTE', s: r6.s, ok: ok6, salvou: !!r6.j?.ok, e: String(r6.j?.error || '').slice(0, 200), ref: r6.j?.ref || null });

    // Limpeza
    const Ld = [];
    for (const id of idsD) { const d = await R('DELETE', '/api/ofs/' + id); Ld.push({ s: d.s, ok: !!d.j?.ok, dset: !!d.j?.data?.deleted_at }); }
    L({ t: 'LIMPEZA', qtd: idsD.length, dels: Ld });

    // Prox num FINAL
    const pf = await R('GET', '/api/ofs/proximo-numero?empId=' + EMP_UUID);
    L({ t: 'PROXN_FINAL', resp: pf.j, OK_2605: pf.j && parseInt(String(pf.j.proximo || 0)) === 2605 });

    L({ t: 'FIM', total: t, passaram: p, pct: (t ? Math.round(100 * p / t) : 0) + '%' });
    process.exit(0);
  } catch (e) { L({ t: 'ERR_GLOBAL', m: String(e), st: String(e.stack || '').slice(0, 500) }); process.exit(1); }
})();
