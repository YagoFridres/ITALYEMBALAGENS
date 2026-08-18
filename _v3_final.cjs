const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const BASE = 'https://adm.italyembalagens.com.br';
const TOKEN = jwt.sign({ id: 't', perfil: 'admin' }, 'italy_secret_2026', { expiresIn: '10h' });
const EMP_UUID = 'df5f7672-798e-4a6e-9393-3d46ed2d0d1f';
const RIPKE_UUID = 'be617df1-441a-470b-b9f3-f681b8d0a9e6';
const VEND_UUID = '00000000-0000-0000-0000-000000000001';
const TARGET = '20260812144428';
const OUT = '_V3_FINAL.jsonl';
fs.writeFileSync(OUT, '');
function L(o) { fs.appendFileSync(OUT, JSON.stringify(o) + '\n'); const s = JSON.stringify(o); console.log(s.length > 500 ? s.slice(0, 500) + '...' : s); }
function S(ms) { return new Promise(r => setTimeout(r, ms)); }
function R(method, path, body = null) {
  return new Promise(resolve => {
    try {
      const u = new URL(BASE + path);
      const opts = {
        method, hostname: u.hostname, port: 443, path: u.pathname + u.search,
        timeout: 45000,
        headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json', 'Accept': 'application/json' }
      };
      const r = https.request(opts, res => {
        let d = ''; res.on('data', c => d += c); res.on('end', () => {
          let j = null; try { j = d ? JSON.parse(d) : null; } catch (e) { j = { _raw: d.slice(0, 500) }; }
          resolve({ s: res.statusCode, j, raw: d.slice(0, 1500) });
        });
      });
      r.on('timeout', () => { r.destroy(); resolve({ s: -1, j: null, err: 'timeout' }); });
      r.on('error', e => resolve({ s: 0, j: null, err: String(e.message || e) }));
      if (body) r.write(JSON.stringify(body)); r.end();
    } catch (e) { resolve({ s: -2, j: null, err: String(e.message || e) }); }
  });
}

(async () => {
  try {
    L({ t: 'INI', target: TARGET });
    let patch = null;
    for (let i = 1; i <= 20; i++) {
      try {
        const r = await R('GET', '/?_=' + Date.now(), null);
        const m = (r.raw || '').match(/patch\.js\?v=(\d+)/);
        patch = m ? m[1] : null;
        L({ t: 'POLL', i, patch, ok: patch === TARGET });
        if (patch === TARGET) break;
      } catch (_) {}
      await S(6000);
    }
    if (patch !== TARGET) { L({ t: 'DEPLOY_FAIL', patch, target: TARGET }); process.exit(2); }

    // Passo 1: oneshot (por segurança)
    const os = await R('POST', '/api/_oneshot_limpar_ofs_orfas_100k', {});
    L({ t: 'ONESHOT', s: os.s, ok: !!os.j?.ok, e: os.j?.error || null, ta: os.j?.total_analisado, talv: os.j?.total_alvos, atu: os.j?.atualizados, f: os.j?.falhas });

    // Passo 2: Prox num Italy (2605)
    const pn = await R('GET', '/api/ofs/proximo-numero?empId=' + EMP_UUID);
    const okProx = pn.j && parseInt(String(pn.j.proximo || 0)) === 2605;
    L({ t: 'PROXN_ITALY', resp: pn.j, esperado: 2605, ok: okProx });

    // Testes de criação
    function makeOf(ov) {
      return {
        clinome: 'MOVEIS RIPKE', descricao: 'ZZZ_TESTE_APAGAR_V3',
        qtd: 10, ent: '2026-12-31', preco: 50,
        vendedor: 'VENDEDOR PADRAO', vendedor_id: VEND_UUID,
        empresa_id: EMP_UUID, emp_id: 'E1', itens: [], ...ov
      };
    }
    const idsD = [];
    const casos = [];
    function addCaso(nome, payload, expected200) {
      casos.push({ nome, payload, expected200 });
    }
    addCaso('C1_BASELINE_UUID', makeOf({ cli_id: RIPKE_UUID, descricao: 'ZZZ_TESTE_APAGAR_V3_C1_UUID' }), true);
    const p2 = makeOf({ cli_id: 'MOVEIS RIPKE', descricao: 'ZZZ_TESTE_APAGAR_V3_C2_EXATO' }); delete p2.clinome;
    addCaso('C2_EXATO_NOME', p2, true);
    const p3 = makeOf({ cli_id: 'MÓVEIS RIPKE', descricao: 'ZZZ_TESTE_APAGAR_V3_C3_ACENTO' }); delete p3.clinome;
    addCaso('C3_COM_ACENTO', p3, true);
    const p4 = makeOf({ cli_id: 'moveis ripke', descricao: 'ZZZ_TESTE_APAGAR_V3_C4_MINUS' }); delete p4.clinome;
    addCaso('C4_MINUS_SEM_ACENTO', p4, true);
    const p5 = makeOf({ cli_id: 'moveis', descricao: 'ZZZ_TESTE_APAGAR_V3_C5_PARCIAL' }); delete p5.clinome;
    addCaso('C5_PARCIAL_AMBIGUO', p5, false);
    const p6 = makeOf({ cli_id: 'xablau cliente nao existe 9999 zzz', descricao: 'ZZZ_TESTE_APAGAR_V3_C6_INEX' }); delete p6.clinome;
    addCaso('C6_INEXISTENTE', p6, false);

    let okTotal = 0;
    for (const c of casos) {
      await S(300);
      const r = await R('POST', '/api/ofs', c.payload);
      const success = !!r.j?.ok;
      const passou = c.expected200 ? success : !success;
      if (passou) okTotal++;
      const det = {
        t: c.nome,
        esperava_200: c.expected200,
        salvou: success,
        passou,
        s: r.s
      };
      if (r.j?.data?.id) idsD.push(r.j.data.id);
      if (success) { det.num = r.j.data.numero || r.j.numero; det.clinome = r.j.data.clinome; }
      else { det.err = String(r.j?.error || r.j?._raw || '').slice(0, 200); det.ref = r.j?.ref || null; det.qtd = r.j?.qtd || null; }
      L(det);
    }

    // Limpeza
    const dels = [];
    for (const id of idsD) { const d = await R('DELETE', '/api/ofs/' + id); dels.push({ s: d.s, ok: !!d.j?.ok, dset: !!d.j?.data?.deleted_at }); }
    L({ t: 'LIMPEZA', qtd: idsD.length, dels });

    // Prox num final (continuar 2605)
    const pnf = await R('GET', '/api/ofs/proximo-numero?empId=' + EMP_UUID);
    L({ t: 'PROXN_FINAL', resp: pnf.j, OK: pnf.j && parseInt(String(pnf.j.proximo || 0)) === 2605 });

    L({ t: 'FIM', totalCasos: casos.length, passaram: okTotal, pct: (casos.length ? Math.round(100 * okTotal / casos.length) : 0) + '%', prox_num_ok: okProx });
    process.exit(0);
  } catch (e) {
    L({ t: 'ERR', m: String(e), st: String(e.stack || '').slice(0, 400) });
    process.exit(1);
  }
})();
