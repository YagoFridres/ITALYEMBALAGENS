const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const BASE = 'https://adm.italyembalagens.com.br';
const TOKEN = jwt.sign({ id: 't', perfil: 'admin', emp_id: 'E1', sigla: 'ITALY' }, 'italy_secret_2026', { expiresIn: '12h' });
const RIPKE = 'be617df1-441a-4f11-918e-d813a5ac854c';
const VEND_UUID = '00000000-0000-0000-0000-000000000001';
function H(method, path, body) {
  return new Promise(res => {
    try {
      const u = new URL(BASE + path);
      const opts = { method, hostname: u.hostname, port: 443, path: u.pathname + u.search, timeout: 120000, headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json', 'Accept-Encoding': 'identity', 'Cache-Control': 'no-cache' } };
      const r = https.request(opts, rsp => { let d = ''; rsp.on('data', c => d += c); rsp.on('end', () => { let j = null; try { j = d ? JSON.parse(d) : null; } catch (e) { j = { _raw: d.slice(0, 1500) }; } res({ s: rsp.statusCode, j, raw0: d.slice(0, 4000) }); }); });
      r.on('error', e => res({ s: 0, j: null, err: String(e.message) })); r.on('timeout', () => { r.destroy(); res({ s: -1, j: null, err: 'timeout' }); });
      if (body) r.write(JSON.stringify(body)); r.end();
    } catch (e) { res({ s: -2, j: null, err: String(e.message) }); }
  });
}
(async () => {
  // 1) Bater com payload completo (V22 ajustado)
  const P = { cliente: 'MÓVEIS RIPKE', clinome: 'MOVEIS RIPKE', cli_id: RIPKE, cliente_id: RIPKE, descricao: 'ZZZ_TESTE_APAGAR_C1', produto: 'ZZZ_TESTE_APAGAR_C1', quantidade: 10, qtd: 10, data_entrega: '2026-12-31', ent: '2026-12-31', preco: 50, valor_unitario: 50, vendedor: 'VENDEDOR PADRAO', vendedor_id: VEND_UUID, vendId: VEND_UUID, itens: [] };
  // Primeiro dbg_full (sem salvar)
  console.log('--- DBG FULL POST ---');
  const d = await H('POST', '/api/_dbg_full_post_ofs', P);
  fs.writeFileSync('_DBG_FULL_C1.json', JSON.stringify(d, null, 2));
  console.log({ status: d.s, ...(typeof d.j === 'object' && d.j !== null ? { campos_ok: d.j.campos_ok, filteredFinal: d.j.filteredFinal, calcR_maior: d.j.calcR?.maior, calcR_prox: d.j.calcR?.proximo, seq: d.j.nextSeq, tentativas_conflicto: d.j.tentativas?.length, erro: String(d.j.erro || d.j.error || d.raw0?.slice?.(0, 200) || '').slice(0, 250) } : { raw: d.raw0?.slice?.(0, 500) || d }) });
  // Agora POST real para pegar erro 500
  console.log('\n--- POST REAL ---');
  const p = await H('POST', '/api/ofs', P);
  fs.writeFileSync('_POST_REAL_C1.json', JSON.stringify(p, null, 2));
  console.log({ status: p.s, j: p.j, raw0: p.raw0?.slice?.(0, 800) });
})();
