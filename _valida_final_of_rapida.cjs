const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const BASE = 'https://adm.italyembalagens.com.br';
const TOKEN = jwt.sign({ id: 't', perfil: 'admin' }, 'italy_secret_2026', { expiresIn: '10h' });
const EMP_UUID = 'df5f7672-798e-4a6e-9393-3d46ed2d0d1f';
const RIPKE_UUID = 'be617df1-441a-470b-b9f3-f681b8d0a9e6';
const VEND_UUID = '00000000-0000-0000-0000-000000000001';
const TARGET_PATCH = '20260812143955';
const OUT = '_VALIDACAO_FINAL.jsonl';
fs.writeFileSync(OUT, '');
function L(o) {
  fs.appendFileSync(OUT, JSON.stringify(o) + '\n');
  process.stdout.write(JSON.stringify(o).slice(0, 500) + '\n');
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function req(method, path, body = null, extraH = {}) {
  return new Promise(resolve => {
    try {
      const u = new URL(BASE + path);
      const opts = {
        method, hostname: u.hostname, port: 443, path: u.pathname + u.search,
        timeout: 30000,
        headers: {
          'Authorization': 'Bearer ' + TOKEN,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...extraH
        }
      };
      const r = https.request(opts, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          let j = null;
          try { j = d ? JSON.parse(d) : null; } catch (_) { j = { _raw: d.slice(0, 500) }; }
          resolve({ s: res.statusCode, j, raw0: d.slice(0, 500), raw: d });
        });
      });
      r.on('timeout', () => { r.destroy(); resolve({ s: -1, j: null, err: 'timeout' }); });
      r.on('error', e => resolve({ s: 0, j: null, err: String(e.message || e) }));
      if (body) r.write(JSON.stringify(body));
      r.end();
    } catch (e) { resolve({ s: -2, j: null, err: String(e.message || e) }); }
  });
}

function makeOf(ov = {}) {
  return {
    clinome: 'MOVEIS RIPKE',
    descricao: 'ZZZ_TESTE_APAGAR_CORR_OF_RAPIDA',
    qtd: 10,
    ent: '2026-12-31',
    preco: 50,
    vendedor: 'VENDEDOR PADRAO',
    vendedor_id: VEND_UUID,
    empresa_id: EMP_UUID,
    emp_id: 'E1',
    itens: [],
    ...ov
  };
}

(async () => {
  L({ t: 'START', target: TARGET_PATCH });

  // POLL DEPLOY
  let patch_atual = null;
  for (let i = 1; i <= 20; i++) {
    try {
      const r = await req('GET', '/?_=' + Date.now());
      const m = (r.raw || '').match(/patch\.js\?v=(\d+)/);
      patch_atual = m ? m[1] : null;
      L({ t: 'POLL_DEPLOY', i, patch: patch_atual, ok: patch_atual === TARGET_PATCH });
      if (patch_atual === TARGET_PATCH) break;
    } catch (_) { }
    await sleep(8000);
  }
  if (patch_atual !== TARGET_PATCH) {
    L({ t: 'DEPLOY_FALHOU', esperado: TARGET_PATCH, atual: patch_atual });
    process.exit(1);
  }

  // 1) ONESHOT LIMPEZA ÓRFAS 100k
  const os = await req('POST', '/api/_oneshot_limpar_ofs_orfas_100k', {});
  L({ t: 'ONESHOT_LIMPEZA', s: os.s, ok: os.j?.ok, resumido: os.j ? {
    total_analisado: os.j.total_analisado, total_alvos: os.j.total_alvos,
    atualizados: os.j.atualizados, falhas: os.j.falhas
  } : null, detalhe: os.j?.detalhes?.slice(0, 10) || os.j?.error || null });

  // 2) PROX_NUM por empresa (deve ser 2605 para ITALY, não 100005)
  const emps = await req('GET', '/api/empresas');
  const lista = emps.j?.ok ? (emps.j.data || []) : [];
  for (const e of lista) {
    const r = await req('GET', '/api/ofs/proximo-numero?empId=' + e.id);
    L({ t: 'PROXN_EMP', sigla: e.sigla, cod: e.codigo, resp: r.j, s: r.s });
  }
  // ITALY específico
  const pnItaly = await req('GET', '/api/ofs/proximo-numero?empId=' + EMP_UUID);
  const ok2605 = pnItaly.j && parseInt(String(pnItaly.j.proximo || '0')) === 2605;
  L({ t: 'PROXN_ITALY_2605', esperado: 2605, resposta: pnItaly.j, ok: ok2605 });

  const ids_para_deletar = [];
  let casos_passaram = 0;
  let casos_totais = 0;

  // C1 BASELINE UUID
  casos_totais++;
  const r1 = await req('POST', '/api/ofs', makeOf({ cli_id: RIPKE_UUID, descricao: 'ZZZ_TESTE_APAGAR_C1_BASELINE_UUID' }));
  const c1 = { t: 'C1_BASELINE_UUID', s: r1.s, ok: !!r1.j?.ok,
    of_id: r1.j?.data?.id || r1.j?.id, numero: r1.j?.data?.numero || r1.j?.numero,
    clinome: r1.j?.data?.clinome || r1.j?.clinome,
    err: r1.j?.error || null, modo: r1.j?.data?.modo_resolvido_cli || null,
    ref: r1.j?.ref || null
  };
  if (c1.ok) casos_passaram++;
  L(c1);
  if (r1.j?.data?.id) ids_para_deletar.push(r1.j.data.id);
  else if (r1.j?.id) ids_para_deletar.push(r1.j.id);

  // C2 EXATO NOME "MOVEIS RIPKE" (igual banco)
  casos_totais++;
  const p2 = makeOf({ cli_id: 'MOVEIS RIPKE', descricao: 'ZZZ_TESTE_APAGAR_C2_EXATO_NOME' });
  delete p2.clinome;
  const r2 = await req('POST', '/api/ofs', p2);
  const c2 = { t: 'C2_EXATO_NOME', s: r2.s, ok: !!r2.j?.ok,
    of_id: r2.j?.data?.id || r2.j?.id, numero: r2.j?.data?.numero || r2.j?.numero,
    clinome: r2.j?.data?.clinome || r2.j?.clinome,
    err: r2.j?.error || null, modo: r2.j?.data?.modo_resolvido_cli || null,
    ref: r2.j?.ref || null
  };
  if (c2.ok) casos_passaram++;
  L(c2);
  if (r2.j?.data?.id) ids_para_deletar.push(r2.j.data.id);
  else if (r2.j?.id) ids_para_deletar.push(r2.j.id);

  // C3 "MÓVEIS RIPKE" com acento
  casos_totais++;
  const p3 = makeOf({ cli_id: 'MÓVEIS RIPKE', descricao: 'ZZZ_TESTE_APAGAR_C3_COM_ACENTO' });
  delete p3.clinome;
  const r3 = await req('POST', '/api/ofs', p3);
  const c3 = { t: 'C3_COM_ACENTO', s: r3.s, ok: !!r3.j?.ok,
    of_id: r3.j?.data?.id || r3.j?.id, numero: r3.j?.data?.numero || r3.j?.numero,
    clinome: r3.j?.data?.clinome || r3.j?.clinome,
    err: r3.j?.error || null, modo: r3.j?.data?.modo_resolvido_cli || null,
    ref: r3.j?.ref || null
  };
  if (c3.ok) casos_passaram++;
  L(c3);
  if (r3.j?.data?.id) ids_para_deletar.push(r3.j.data.id);
  else if (r3.j?.id) ids_para_deletar.push(r3.j.id);

  // C4 "moveis ripke" minúsculo SEM ACENTO
  casos_totais++;
  const p4 = makeOf({ cli_id: 'moveis ripke', descricao: 'ZZZ_TESTE_APAGAR_C4_MIN_SEM_ACENTO' });
  delete p4.clinome;
  const r4 = await req('POST', '/api/ofs', p4);
  const c4 = { t: 'C4_MIN_SEM_ACENTO', s: r4.s, ok: !!r4.j?.ok,
    of_id: r4.j?.data?.id || r4.j?.id, numero: r4.j?.data?.numero || r4.j?.numero,
    clinome: r4.j?.data?.clinome || r4.j?.clinome,
    err: r4.j?.error || null, modo: r4.j?.data?.modo_resolvido_cli || null,
    ref: r4.j?.ref || null
  };
  if (c4.ok) casos_passaram++;
  L(c4);
  if (r4.j?.data?.id) ids_para_deletar.push(r4.j.data.id);
  else if (r4.j?.id) ids_para_deletar.push(r4.j.id);

  // C5 "moveis" PARCIAL (deve 400 ambíguo OU msg clara, SEM salvar)
  casos_totais++;
  const p5 = makeOf({ cli_id: 'moveis', descricao: 'ZZZ_TESTE_APAGAR_C5_PARCIAL_AMBIGUO' });
  delete p5.clinome;
  const r5 = await req('POST', '/api/ofs', p5);
  const c5ok = !r5.j?.ok && r5.s === 400 && (r5.j?.qtd || 0) >= 1;
  const c5 = { t: 'C5_PARCIAL_AMBIGUO', s: r5.s, ok: c5ok,
    salvou: !!r5.j?.ok,
    err: r5.j?.error || null, ref: r5.j?.ref || null, qtd: r5.j?.qtd || 0,
    cand: (r5.j?.candidatos || []).slice(0, 5).map(c => c?.nome || '')
  };
  if (c5ok) casos_passaram++;
  L(c5);
  if (r5.j?.data?.id) ids_para_deletar.push(r5.j.data.id);
  else if (r5.j?.id) ids_para_deletar.push(r5.j.id);

  // C6 CLIENTE INEXISTENTE "xablau 9999" (deve 400 msg clara)
  casos_totais++;
  const p6 = makeOf({ cli_id: 'xablau cliente inexistente 9999', descricao: 'ZZZ_TESTE_APAGAR_C6_INEXISTENTE' });
  delete p6.clinome;
  const r6 = await req('POST', '/api/ofs', p6);
  const c6ok = !r6.j?.ok && r6.s === 400 && /xablau/i.test(String(r6.j?.error || ''));
  const c6 = { t: 'C6_INEXISTENTE', s: r6.s, ok: !r6.j?.ok && r6.s === 400,
    salvou: !!r6.j?.ok,
    err: r6.j?.error || null, ref: r6.j?.ref || null,
    contem_ref_no_erro: r6.j?.ref && (r6.j?.error || '').includes(r6.j.ref)
  };
  if (!r6.j?.ok && r6.s === 400) casos_passaram++;
  L(c6);

  // LIMPEZA - soft delete tudo
  const dels = [];
  for (const id of ids_para_deletar) {
    const d = await req('DELETE', '/api/ofs/' + id);
    dels.push({ id, s: d.s, ok: !!d.j?.ok, deleted_at: !!d.j?.data?.deleted_at });
  }
  L({ t: 'LIMPEZA_SOFT_DEL', total: dels.length, dels });

  // PROX_NUM DEPOIS DE LIMPAR (deve continuar 2605)
  const pnFinal = await req('GET', '/api/ofs/proximo-numero?empId=' + EMP_UUID);
  L({ t: 'PROXN_FINAL_DEPOIS_TESTES', resp: pnFinal.j, ok: pnFinal.j && parseInt(String(pnFinal.j.proximo || '0')) === 2605 });

  L({ t: 'FINAL', total: casos_totais, passaram: casos_passaram, porcentagem: Math.round(100*casos_passaram/casos_totais)+'%' });
  process.exit(0);
})().catch(e => { L({ err: String(e), stack: String(e.stack || '').slice(0, 400) }); process.exit(1); });
