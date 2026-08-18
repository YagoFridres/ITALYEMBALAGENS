const https = require('https');
const jwt = require('jsonwebtoken');
const T = '20260813004500';
const BASE = 'https://adm.italyembalagens.com.br';
const TOKEN = jwt.sign({ id: 't', perfil: 'admin', emp_id: 'E1', sigla: 'ITALY' }, 'italy_secret_2026', { expiresIn: '12h' });
const RIPKE = 'be617df1-441a-4f11-918e-d813a5ac854c';
const VEND = '00000000-0000-0000-0000-000000000001';
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
  const sw = await new Promise(r => https.get({ hostname: 'adm.italyembalagens.com.br', port: 443, path: '/sw.js?__nc=' + Date.now(), headers: { 'Accept-Encoding': 'identity', 'Cache-Control': 'no-cache' } }, rr => { let d = ''; rr.on('data', c => d += c); rr.on('end', () => r(d.includes(T) ? 'OK' : 'NAO')); }).on('error', () => r('ERR')));
  console.log('sw versao ' + T + ':', sw);
  // 1) DIAG PROXN
  const dp = await H('GET', '/api/_diag_proxnum');
  console.log('DIAG maior:', dp.j?.res_por_resolver?.maior, ' proximo:', dp.j?.res_por_resolver?.proximo, 'top2:', (dp.j?.res_por_resolver?.top15 || []).slice(0, 2).map(x => ({ n: x.n, emp_id: x.emp_id })));
  // 2) 3x LIMPEZA oneshot
  for (let k = 0; k < 3; k++) {
    const a = await H('POST', '/api/_oneshot_limpar_ofs_italy_testes');
    const b = await H('POST', '/api/_oneshot_limpar_ofs_orfas_100k');
    console.log('LIMPEZA', k, ':', a.j?.atualizados || 0, '/', b.j?.atualizados || 0);
    await new Promise(r => setTimeout(r, 1000));
  }
  // 3) C1 (baseline)
  const PAY = { cliente: 'MOVEIS RIPKE', clinome: 'MOVEIS RIPKE', cli_id: RIPKE, cliente_id: RIPKE, descricao: 'ZZZ_TESTE_APAGAR_PROBE', produto: 'ZZZ_TESTE_APAGAR_PROBE', quantidade: 10, qtd: 10, data_entrega: '2026-12-31', ent: '2026-12-31', preco: 50, valor_unitario: 50, vendedor: 'VENDEDOR PADRAO', vendedor_id: VEND, vendId: VEND, itens: [] };
  const c1 = await H('POST', '/api/ofs', PAY);
  const of1 = Array.isArray(c1.j?.data) ? c1.j.data[0] : (c1.j?.data || null);
  console.log('C1:', JSON.stringify({ s: c1.s, ok: c1.j?.ok, numero: of1?.numero, of: of1?.of, of_num: of1?.of_num, cli: of1?.cli_id ? String(of1.cli_id).slice(0, 20) : '', err: c1.j?.error ? String(c1.j.error).slice(0, 400) : '', lastErro: c1.j?.lastErro, lastCode: c1.j?.lastCode, lastDetails: c1.j?.lastDetails, ignoredColumns: c1.j?.ignoredColumns || c1.j?.warnings || null }));
  // 4) LIMPAR APENAS o que foi criado agora
  await H('POST', '/api/_oneshot_limpar_ofs_italy_testes');
})();
