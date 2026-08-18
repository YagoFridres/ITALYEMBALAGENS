const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const BASE = 'https://adm.italyembalagens.com.br';
const TOKEN = jwt.sign({ id: 't', perfil: 'admin' }, 'italy_secret_2026', { expiresIn: '10h' });
const EMP_UUID = 'df5f7672-798e-4a6e-9393-3d46ed2d0d1f';
const RIPKE_UUID = 'be617df1-441a-470b-b9f3-f681b8d0a9e6';

function req(method, path, body = null) {
  return new Promise((resolve) => {
    const u = new URL(BASE + path);
    const opts = {
      method,
      hostname: u.hostname,
      port: 443,
      path: u.pathname + u.search,
      headers: {
        'Authorization': 'Bearer ' + TOKEN,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    const reqObj = https.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        let json = null;
        try { json = data ? JSON.parse(data) : null; } catch (_) { json = { _raw: data.slice(0, 500) }; }
        resolve({ s: res.statusCode, json, raw: data.slice(0, 2000) });
      });
    });
    reqObj.on('error', (e) => resolve({ s: 0, json: null, err: String(e.message || e) }));
    if (body) reqObj.write(JSON.stringify(body));
    reqObj.end();
  });
}

const VEND_UUID = '00000000-0000-0000-0000-000000000001';

function makeOfPayload(overrides = {}) {
  return {
    clinome: 'MOVEIS RIPKE',
    descricao: 'ZZZ_TESTE_APAGAR_CORRECAO_OF_RAPIDA',
    qtd: 10,
    ent: '2026-12-31',
    preco: 50,
    vendedor: 'VENDEDOR PADRAO',
    vendedor_id: VEND_UUID,
    empresa_id: EMP_UUID,
    emp_id: 'E1',
    itens: [],
    ...overrides
  };
}

(async () => {
  const out = [];

  // 1) Próximo número DEDICADO (já confirmou 100005, repete para confirmar)
  const pn = await req('GET', '/api/ofs/proximo-numero?empId=' + EMP_UUID);
  out.push({ t: 'PROX_NUM_ANTES', ...pn.json });

  // 2) Top 20 OFs POR NÚMERO DESC (empresa Italy E1) — INCLUINDO deleted_at
  const ofsResp = await req('GET', '/api/ofs?limit=30&order=numero.desc&empId=' + EMP_UUID + '&_incluir_deletados=1');
  let ofsRows = [];
  if (ofsResp.json?.ok) {
    if (Array.isArray(ofsResp.json.ofs)) ofsRows = ofsResp.json.ofs;
    else if (Array.isArray(ofsResp.json.data)) ofsRows = ofsResp.json.data;
  }
  out.push({
    t: 'TOP20_NUMERO_DESC',
    qtd: ofsRows.length,
    ofs: ofsRows.slice(0,25).map(o => ({
      numero: o.numero || o.of,
      seq: o.seq,
      deleted_at: o.deleted_at ? 'SIM_' + String(o.deleted_at).slice(0,10) : 'NÃO',
      clinome: String(o.clinome || '').slice(0,30),
      desc: String(o.descricao || o.produto || '').slice(0,40),
      emp_id: o.emp_id,
      created: String(o.created_at || '').slice(0,10)
    }))
  });

  // 3) Contar quantas OFs com deleted_at=NÃO existem por faixas
  const totalAtivas = ofsRows.filter(o => !o.deleted_at).length;
  const com100k = ofsRows.filter(o => {
    const n = parseInt(String(o.numero || o.of || '0').replace(/\D/g, ''));
    return n >= 100000 && !o.deleted_at;
  });
  out.push({ t: 'CONTAGEM', total_ativas_top30: totalAtivas, qtd_100k_ativas: com100k.length, com100k: com100k.map(o=>({numero:o.numero,deleted:!!o.deleted_at,desc:String(o.descricao||'').slice(0,40)})) });

  // 4) Buscar RIPKE via /api/clientes
  const cR = await req('GET', '/api/clientes?limit=3&search=MOVEIS%20RIPKE&empId=' + EMP_UUID);
  let cliRipke = null;
  if (cR.json?.ok) {
    const arr = Array.isArray(cR.json.data) ? cR.json.data : (Array.isArray(cR.json.ofs) ? cR.json.ofs : (Array.isArray(cR.json) ? cR.json : []));
    cliRipke = arr[0] || null;
    out.push({ t: 'RIPKE_GET', qtd: arr.length, cli: cliRipke ? {id:cliRipke.id, nome:cliRipke.nome, codigo:cliRipke.codigo, emp_id:cliRipke.emp_id} : null });
  } else {
    out.push({ t: 'RIPKE_GET', s: cR.s, raw: cR.raw.slice(0,500) });
  }

  const criarIds = [];

  // CASO 1: BASELINE UUID (deve 200 sempre)
  const pl1 = makeOfPayload({ cli_id: RIPKE_UUID, descricao: 'ZZZ_TESTE_APAGAR_BASELINE_UUID_C1' });
  const r1 = await req('POST', '/api/ofs', pl1);
  const c1 = { t: 'C1_BASELINE_UUID', s: r1.s, ok: !!r1.json?.ok, of_id: r1.json?.data?.id || r1.json?.id, numero: r1.json?.data?.numero || r1.json?.numero, err: r1.json?.error || null, modo: r1.json?.data?.modo_resolvido_cli || null };
  if (!r1.json?.ok) c1.ref = r1.json?.ref || null;
  out.push(c1);
  if (r1.json?.data?.id || r1.json?.id) criarIds.push(r1.json.data?.id || r1.json.id);

  // CASO 2: EXATO BANCO "MOVEIS RIPKE" texto
  const pl2 = makeOfPayload({ cli_id: 'MOVEIS RIPKE', descricao: 'ZZZ_TESTE_APAGAR_EXATO_NOME_C2' });
  delete pl2.clinome;
  const r2 = await req('POST', '/api/ofs', pl2);
  const c2 = { t: 'C2_EXATO_NOME', s: r2.s, ok: !!r2.json?.ok, of_id: r2.json?.data?.id || r2.json?.id, numero: r2.json?.data?.numero || r2.json?.numero, err: r2.json?.error || null, ref: r2.json?.ref || null };
  out.push(c2);
  if (r2.json?.data?.id || r2.json?.id) criarIds.push(r2.json.data?.id || r2.json.id);

  // CASO 3: "MÓVEIS RIPKE" com acento
  const pl3 = makeOfPayload({ cli_id: 'MÓVEIS RIPKE', descricao: 'ZZZ_TESTE_APAGAR_ACENTO_C3' });
  delete pl3.clinome;
  const r3 = await req('POST', '/api/ofs', pl3);
  const c3 = { t: 'C3_ACENTO', s: r3.s, ok: !!r3.json?.ok, of_id: r3.json?.data?.id || r3.json?.id, numero: r3.json?.data?.numero || r3.json?.numero, err: r3.json?.error || null, ref: r3.json?.ref || null };
  out.push(c3);
  if (r3.json?.data?.id || r3.json?.id) criarIds.push(r3.json.data?.id || r3.json.id);

  // CASO 4: "moveis ripke" minúsculo s/ acento
  const pl4 = makeOfPayload({ cli_id: 'moveis ripke', descricao: 'ZZZ_TESTE_APAGAR_MINUS_C4' });
  delete pl4.clinome;
  const r4 = await req('POST', '/api/ofs', pl4);
  const c4 = { t: 'C4_MINUS_SEM_ACENTO', s: r4.s, ok: !!r4.json?.ok, of_id: r4.json?.data?.id || r4.json?.id, numero: r4.json?.data?.numero || r4.json?.numero, err: r4.json?.error || null, ref: r4.json?.ref || null };
  out.push(c4);
  if (r4.json?.data?.id || r4.json?.id) criarIds.push(r4.json.data?.id || r4.json.id);

  // CASO 5: "moveis" parcial (deve dar ambíguo OU 400 mensagem clara)
  const pl5 = makeOfPayload({ cli_id: 'moveis', descricao: 'ZZZ_TESTE_APAGAR_PARCIAL_C5' });
  delete pl5.clinome;
  const r5 = await req('POST', '/api/ofs', pl5);
  const c5 = { t: 'C5_PARCIAL_AMBIGUO', s: r5.s, ok: !!r5.json?.ok, err: r5.json?.error || null, ref: r5.json?.ref || null, qtd: r5.json?.qtd || null, cand: (r5.json?.candidatos||[]).slice(0,5).map(c=>c.nome||'') };
  out.push(c5);
  if (r5.json?.data?.id || r5.json?.id) criarIds.push(r5.json.data?.id || r5.json.id);

  // LIMPEZA: soft-delete TODAS ids criadas
  const dels = [];
  for (const id of criarIds) {
    const d = await req('DELETE', '/api/ofs/' + id);
    dels.push({ id, s: d.s, ok: !!d.json?.ok, deleted_at_setado: !!d.json?.data?.deleted_at });
  }
  out.push({ t: 'DELETES', qtd: dels.length, dels });

  // PROX NUM depois da limpeza
  const pnDepois = await req('GET', '/api/ofs/proximo-numero?empId=' + EMP_UUID);
  out.push({ t: 'PROX_NUM_DEPOIS_DEL', ...pnDepois.json });

  // Verificação final: buscar OFs com ZZZ_TESTE que ainda estão ATIVAS (deleted_at não setado)
  const fResp = await req('GET', '/api/ofs?limit=30&search=ZZZ_TESTE&empId=' + EMP_UUID);
  let fRows = [];
  if (fResp.json?.ok) {
    if (Array.isArray(fResp.json.ofs)) fRows = fResp.json.ofs;
    else if (Array.isArray(fResp.json.data)) fRows = fResp.json.data;
  }
  out.push({
    t: 'VERIF_ZZZ_RESTANTES_ATIVOS',
    qtd: fRows.length,
    ativos: fRows.filter(o => !o.deleted_at).map(o => ({ id: o.id, numero: o.numero, desc: String(o.descricao||'').slice(0,50) }))
  });

  console.log(JSON.stringify(out, null, 2));
  fs.writeFileSync('_DIAG_CRITICO_V2.json', JSON.stringify(out, null, 2));
})();
