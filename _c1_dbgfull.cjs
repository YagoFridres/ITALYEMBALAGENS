const https = require('https');
const jwt = require('jsonwebtoken');
const BASE = 'https://adm.italyembalagens.com.br';
const TOKEN = jwt.sign({ id: 't', perfil: 'admin', emp_id: 'E1', sigla: 'ITALY' }, 'italy_secret_2026', { expiresIn: '12h' });
const RIPKE = 'be617df1-441a-4f11-918e-d813a5ac854c';
const VEND = '00000000-0000-0000-0000-000000000001';
function H(method, path, body) {
  return new Promise(res => {
    const u = new URL(BASE + path);
    const opts = { method, hostname: u.hostname, port: 443, path: u.pathname + u.search, timeout: 120000, headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json', 'Accept-Encoding': 'identity', 'Cache-Control': 'no-cache' } };
    const r = https.request(opts, rsp => { let d = ''; rsp.on('data', c => d += c); rsp.on('end', () => { let j = null; try { j = d ? JSON.parse(d) : null; } catch (e) { j = { _raw: d.slice(0, 3000) }; } res({ s: rsp.statusCode, j, raw0: d.slice(0, 8000) }); }); });
    r.on('error', e => res({ s: 0, j: null, err: String(e.message) }));
    r.on('timeout', () => { r.destroy(); res({ s: -1, j: null, err: 'timeout' }); });
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}
(async () => {
  const payload = {
    cliente: 'MÓVEIS RIPKE', clinome: 'MOVEIS RIPKE',
    descricao: 'ZZZ_TESTE_APAGAR_C1DBG', produto: 'ZZZ_TESTE_APAGAR_C1DBG',
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
  const t0 = Date.now();
  console.log('POST _dbg_full_post_ofs starting');
  const r = await H('POST', '/api/_dbg_full_post_ofs', payload);
  console.log('status', r.s, 'time_ms', Date.now() - t0);
  const D = r.j?.DEBUG || r.j;
  if (D?.calcR) console.log('DEBUG.calcR.proximo=', D.calcR.proximo, 'maior=', D.calcR.maior, 'maxSql=', D.calcR.maxSql, 'sqlOk=', D.calcR.sqlOk);
  if (D?.blocoEntrou !== undefined) console.log('DEBUG.blocoEntrou=', D.blocoEntrou, 'escolhido=', D.escolhido);
  if (D?.conflitoLog) { console.log('DEBUG.conflitoLog.length=', D.conflitoLog.length); D.conflitoLog.slice(-3).forEach(x => console.log('  conflito:', JSON.stringify(x).slice(0,400))); }
  if (D?.filteredFinal) console.log('DEBUG.filteredFinal=', JSON.stringify(D.filteredFinal));
  if (r.j?.ok === false || r.j?.error) console.log('ERROR json=', r.j?.error, 'raw=', r.raw0?.slice(0,1000));
  if (r.j?.data || r.j?.ok === true) { const of = Array.isArray(r.j?.data) ? r.j.data[0] : null; console.log('OF SALVA id=', of?.id, 'numero=', of?.numero, 'of=', of?.of, 'of_num=', of?.of_num, 'clinome=', of?.clinome); }
  console.log('DONE');
})();
