const https = require('https');
const jwt = require('jsonwebtoken');
const BASE = 'https://adm.italyembalagens.com.br';
const TOKEN = jwt.sign({ id: 't', perfil: 'admin', emp_id: 'E1', sigla: 'ITALY' }, 'italy_secret_2026', { expiresIn: '10h' });
function R(method, path, body) {
  return new Promise(resolve => {
    try {
      const u = new URL(BASE + path);
      const opts = { method, hostname: u.hostname, port: 443, path: u.pathname + u.search, timeout: 60000, headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json', 'Accept-Encoding': 'identity', 'Cache-Control': 'no-cache' } };
      const r = https.request(opts, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { let j = null; try { j = d ? JSON.parse(d) : null; } catch (e) { j = { _raw: d.slice(0, 2000) }; } resolve({ s: res.statusCode, j, raw0: d.slice(0, 3000) }); }); });
      r.on('error', e => resolve({ s: 0, j: null, err: String(e.message) })); r.on('timeout', () => { r.destroy(); resolve({ s: -1, j: null, err: 'timeout' }); });
      if (body) r.write(JSON.stringify(body)); r.end();
    } catch (e) { resolve({ s: -2, j: null, err: String(e.message) }); }
  });
}
(async () => {
  for (let i = 0; i < 3; i++) {
    const A = await R('POST', '/api/_oneshot_limpa_italy_teste_100k_e_zzz_teste');
    const B = await R('POST', '/api/_oneshot_limpa_orfas_100k_e_zzz');
    console.log('ROUND', i, 'ITALY:', A.j?.data || A.j, 'ORFAS:', B.j?.data || B.j);
    await new Promise(r => setTimeout(r, 1500));
  }
  const D = await R('GET', '/api/_diag_proxnum');
  const top3 = (D.j?.res_por_resolver?.top15 || []).slice(0, 3).map(x => ({ n: x.n, emp_id: x.emp_id, eid: x.empresa_id, del: x.deleted_at ? 'del' : '' }));
  console.log('DIAG_MAIOR=', D.j?.res_por_resolver?.maior, 'DIAG_PROXN=', D.j?.res_por_resolver?.proximo, 'TOP3:', top3);
  const payload = { cliente: 'MÓVEIS RIPKE', clinome: 'MOVEIS RIPKE', descricao: 'ZZZ_TESTE_APAGAR_V18', qtd: 10, data_entrega: '2026-12-31', preco: 50, vendedor: 'VENDEDOR PADRAO', vendedor_id: '00000000-0000-0000-0000-000000000001', itens: [], cli_id: 'be617df1-441a-4f11-918e-d813a5ac854c' };
  const P = await R('POST', '/api/ofs', payload);
  const of = P.j?.data?.[0] || P.j?.data || P.j;
  console.log('POST status:', P.s, ' | numero:', of?.numero, 'of:', of?.of, 'of_num:', of?.of_num, ' | cliente:', of?.clinome, ' | id:', String(of?.id || '').slice(0, 16), ' | err:', P.j?.error || P.j?.message || '');
  const D2 = await R('GET', '/api/_diag_proxnum');
  console.log('D2 MAIOR=', D2.j?.res_por_resolver?.maior, 'PROXN=', D2.j?.res_por_resolver?.proximo);
})();
