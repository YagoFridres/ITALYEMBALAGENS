const https = require('https');
const jwt = require('jsonwebtoken');
const BASE = 'https://adm.italyembalagens.com.br';
const TOKEN = jwt.sign({ id: 't', perfil: 'admin', emp_id: 'E1', sigla: 'ITALY' }, 'italy_secret_2026', { expiresIn: '12h' });
const RIPKE = 'be617df1-441a-4f11-918e-d813a5ac854c';
const VEND = '00000000-0000-0000-0000-000000000001';
function H(method, path, body) {
  return new Promise(res => {
    const u = new URL(BASE + path);
    const opts = { method, hostname: u.hostname, port: 443, path: u.pathname + u.search, timeout: 300000, headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json', 'Accept-Encoding': 'identity', 'Cache-Control': 'no-cache' } };
    const r = https.request(opts, rsp => { let d = ''; rsp.on('data', c => d += c); rsp.on('end', () => { let j = null; try { j = d ? JSON.parse(d) : null; } catch (e) { j = { _raw: d.slice(0, 2000) }; } res({ s: rsp.statusCode, j, raw0: d.slice(0, 5000) }); }); });
    r.on('error', e => res({ s: 0, j: null, err: String(e.message) }));
    r.on('timeout', () => { r.destroy(); res({ s: -1, j: null, err: 'timeout' }); });
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}
(async () => {
  try {
    console.log('STEP1 DIAG');
    const d = await H('GET', '/api/_diag_proxnum');
    console.log('DIAG s=', d.s, 'maior=', d.j?.res_por_resolver?.maior, 'prox=', d.j?.res_por_resolver?.proximo, 'err=', d.j?.res_por_resolver?.erro ?? d.j?.error ?? null);

    console.log('STEP2 LIMPEZA');
    const a = await H('POST', '/api/_oneshot_limpar_ofs_italy_testes');
    const b = await H('POST', '/api/_oneshot_limpar_ofs_orfas_100k');
    console.log('LIMPEZA', a.j, b.j);

    console.log('STEP3 POST C1');
    const payload = {
      cliente: 'MÓVEIS RIPKE', clinome: 'MOVEIS RIPKE',
      descricao: 'ZZZ_TESTE_APAGAR_V22_C1', produto: 'ZZZ_TESTE_APAGAR_V22_C1',
      cli_id: RIPKE, cliente_id: RIPKE,
      quantidade: 10, qtd: 10, qtd_pedida: 10,
      data_entrega: '2026-12-31', ent: '2026-12-31',
      preco: 50, valor_unitario: 50, total: 500, valor_total: 500, valor_venda: 500,
      vendedor: 'VENDEDOR PADRAO', vendedor_id: VEND, vendId: VEND, vend_id: VEND,
      empresa_id: 'df5f7672-0a6b-402d-ae65-296554236c31',
      empId: 'df5f7672-0a6b-402d-ae65-296554236c31',
      emp_id: 'E1',
      itens: []
    };
    const c1 = await H('POST', '/api/ofs', payload);
    console.log('C1 s=' + c1.s);
    const of = Array.isArray(c1.j?.data) ? c1.j.data[0] : (c1.j?.data || c1.j);
    console.log('C1 obj keys:', Object.keys(c1.j || {}));
    console.log('C1 s=' + c1.s + ' numero=' + (of?.numero ?? '?') + ' of=' + (of?.of ?? '?') + ' of_num=' + (of?.of_num ?? '?') + ' id=' + String(of?.id || '').slice(0, 20) + ' clinome=' + (of?.clinome || '') + ' cli_id=' + (of?.cli_id || '') + ' lastErro=' + (c1.j?.lastErro ? String(c1.j.lastErro).slice(0, 300) : '') + ' lastCode=' + (c1.j?.lastCode || '') + ' lastDetails=' + (c1.j?.lastDetails ? String(c1.j.lastDetails).slice(0,300) : '') + ' ignoredColumns=' + JSON.stringify(c1.j?.ignoredColumns || []));

    console.log('STEP4 DIAG NOVAMENTE');
    const d2 = await H('GET', '/api/_diag_proxnum');
    console.log('DIAG2 maior=', d2.j?.res_por_resolver?.maior, 'prox=', d2.j?.res_por_resolver?.proximo, 'err=', d2.j?.res_por_resolver?.erro ?? null);

    console.log('STEP5 LIMPEZA FINAL');
    await H('POST', '/api/_oneshot_limpar_ofs_italy_testes');
    await H('POST', '/api/_oneshot_limpar_ofs_orfas_100k');
    console.log('DONE');
  } catch (e) {
    console.log('FATAL ERR', e.message, e.stack);
  }
})();
