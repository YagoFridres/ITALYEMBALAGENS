const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const BASE = 'https://adm.italyembalagens.com.br';
const TOKEN = jwt.sign({ id: 't', perfil: 'admin' }, 'italy_secret_2026', { expiresIn: '10h' });
const EMP_UUID = 'df5f7672-798e-4a6e-9393-3d46ed2d0d1f';
const RIPKE_UUID = 'be617df1-441a-470b-b9f3-f681b8d0a9e6';
const VEND_UUID = '00000000-0000-0000-0000-000000000001';
const OUT = '_V4_RESULT.jsonl';
fs.writeFileSync(OUT, '');
function L(o) { fs.appendFileSync(OUT, JSON.stringify(o) + '\n'); const s = JSON.stringify(o); console.log(s.length > 400 ? s.slice(0, 400) + '...' : s); }
function R(method, path, body) {
  return new Promise(resolve => {
    try {
      const u = new URL(BASE + path);
      const opts = {
        method, hostname: u.hostname, port: 443, path: u.pathname + u.search, timeout: 45000,
        headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json', 'Accept-Encoding': 'identity' }
      };
      const r = https.request(opts, res => {
        let d = ''; res.on('data', c => d += c); res.on('end', () => {
          let j = null; try { j = d ? JSON.parse(d) : null; } catch (e) { j = { _raw: d.slice(0, 400) }; }
          resolve({ s: res.statusCode, j, raw0: d.slice(0, 800) });
        });
      });
      r.on('error', e => resolve({ s: 0, j: null, err: String(e.message) }));
      r.on('timeout', () => { r.destroy(); resolve({ s: -1, j: null, err: 'timeout' }); });
      if (body) r.write(JSON.stringify(body)); r.end();
    } catch (e) { resolve({ s: -2, j: null, err: String(e.message) }); }
  });
}
function makeOf(ov = {}) {
  return Object.assign({
    clinome: 'MOVEIS RIPKE', descricao: 'ZZZ_TESTE_APAGAR_V4',
    qtd: 10, ent: '2026-12-31', preco: 50,
    vendedor: 'VENDEDOR PADRAO', vendedor_id: VEND_UUID,
    empresa_id: EMP_UUID, emp_id: 'E1', itens: []
  }, ov);
}

(async () => {
  try {
    // 0) Confirmar RIPKE existe via GET /api/clientes
    const cr = await R('GET', '/api/clientes?limit=2&search=RIPKE&empId=' + EMP_UUID);
    const cliArr = (cr.j?.ok && Array.isArray(cr.j.data)) ? cr.j.data : (Array.isArray(cr.j) ? cr.j : []);
    const ripke = cliArr[0] || null;
    L({ t: 'CHECK_RIPKE_EXISTE', s: cr.s, qtd: cliArr.length, ripke: ripke ? { id: ripke.id?.slice(0, 20), nome: ripke.nome, emp_id: ripke.emp_id, empresa_id_len: String(ripke.empresa_id || '').length } : null, e: cr.j?.error || null });

    // 1) PROX_NUM Italy
    const pn = await R('GET', '/api/ofs/proximo-numero?empId=' + EMP_UUID);
    const ok2605 = pn.j && parseInt(String(pn.j.proximo || '0')) === 2605;
    L({ t: 'PROXN_2605', ok: ok2605, resp: pn.j });

    // 2) ONESHOT (confirmar, pode rodar de novo, idempotente)
    const os = await R('POST', '/api/_oneshot_limpar_ofs_orfas_100k', {});
    L({ t: 'ONESHOT', s: os.s, ok: !!os.j?.ok, ta: os.j?.total_analisado, tgt: os.j?.total_alvos, at: os.j?.atualizados, err: os.j?.error || null });

    // Casos
    const idsDel = [];
    const casos = [];
    async function runCaso(nome, payload, esperar200) {
      const r = await R('POST', '/api/ofs', payload);
      const ok = !!r.j?.ok;
      const passou = esperar200 ? ok : !ok;
      const obj = { t: nome, esperava_200: esperar200, salvou: ok, passou, s: r.s };
      if (ok) {
        obj.numero = r.j?.data?.numero || r.j?.numero;
        obj.clinome = r.j?.data?.clinome;
        obj.cli_id_bd = r.j?.data?.cli_id ? r.j.data.cli_id.slice(0, 15) + '...' : null;
        if (r.j?.data?.id) idsDel.push(r.j.data.id);
      } else {
        obj.err = String(r.j?.error || r.j?._raw || r.raw0 || '').slice(0, 220);
        obj.ref = r.j?.ref || null;
        obj.qtd = r.j?.qtd || null;
      }
      L(obj);
      casos.push({ nome, passou });
      return passou;
    }

    // C1 Baseline UUID
    await runCaso('C1_BASELINE_UUID', makeOf({ cli_id: RIPKE_UUID, descricao: 'ZZZ_TESTE_APAGAR_V4_C1_UUID' }), true);
    // C2 EXATO nome
    const p2 = makeOf({ cli_id: 'MOVEIS RIPKE', descricao: 'ZZZ_TESTE_APAGAR_V4_C2_EXATO_NOME' }); delete p2.clinome;
    await runCaso('C2_EXATO_NOME', p2, true);
    // C3 Acento
    const p3 = makeOf({ cli_id: 'MÓVEIS RIPKE', descricao: 'ZZZ_TESTE_APAGAR_V4_C3_ACENTO' }); delete p3.clinome;
    await runCaso('C3_COM_ACENTO', p3, true);
    // C4 minúsculo sem acento
    const p4 = makeOf({ cli_id: 'moveis ripke', descricao: 'ZZZ_TESTE_APAGAR_V4_C4_MIN' }); delete p4.clinome;
    await runCaso('C4_MINUS_SEMACENTO', p4, true);
    // C5 Parcial
    const p5 = makeOf({ cli_id: 'moveis', descricao: 'ZZZ_TESTE_APAGAR_V4_C5_PARCIAL' }); delete p5.clinome;
    await runCaso('C5_PARCIAL_AMBIGUO', p5, false);
    // C6 Inexistente
    const p6 = makeOf({ cli_id: 'xablau cliente inexistente 9999 zzz', descricao: 'ZZZ_TESTE_APAGAR_V4_C6_INEX' }); delete p6.clinome;
    await runCaso('C6_INEXISTENTE', p6, false);

    // Deletar
    const dels = [];
    for (const id of idsDel) {
      const d = await R('DELETE', '/api/ofs/' + id);
      dels.push({ id: id.slice(0, 10) + '...', s: d.s, ok: !!d.j?.ok, dset: !!d.j?.data?.deleted_at });
    }
    L({ t: 'LIMPEZA_SOFT_DEL', qtd: idsDel.length, dels });

    // ProxNum FINAL (continuar 2605)
    const pnF = await R('GET', '/api/ofs/proximo-numero?empId=' + EMP_UUID);
    L({ t: 'PROXN_FINAL_2605', ok: pnF.j && parseInt(String(pnF.j.proximo || '0')) === 2605, resp: pnF.j });

    // Resumo
    const passaram = casos.filter(c => c.passou).length;
    L({ t: 'RESUMO_FINAL', total: casos.length, passaram, pct: Math.round(100 * passaram / casos.length) + '%', casos: casos.map(c => ({ n: c.nome, p: c.passou })) });
    process.exit(0);
  } catch (e) {
    L({ t: 'ERR_GLOBAL', msg: String(e), st: String(e.stack || '').slice(0, 300) });
    process.exit(1);
  }
})();
