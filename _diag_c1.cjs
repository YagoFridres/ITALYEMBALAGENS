const https = require('https');
const jwt = require('jsonwebtoken');
const TOKEN = jwt.sign({ id: 't', perfil: 'admin', emp_id: 'E1', sigla: 'ITALY' }, 'italy_secret_2026', { expiresIn: '10h' });
const BASE = 'https://adm.italyembalagens.com.br';
function R(method, path, body) {
  return new Promise(resolve => {
    try {
      const u = new URL(BASE + path);
      const opts = { method, hostname: u.hostname, port: 443, path: u.pathname + u.search, timeout: 45000, headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' } };
      const r = https.request(opts, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { let j = null; try { j = d ? JSON.parse(d) : null; } catch (e) { j = { _raw: d.slice(0, 800) }; } resolve({ s: res.statusCode, j, raw0: d.slice(0, 2000) }); }); });
      r.on('error', e => resolve({ s: 0, j: null, err: String(e.message) })); r.on('timeout', () => { r.destroy(); resolve({ s: -1, j: null, err: 'timeout' }); });
      if (body) r.write(JSON.stringify(body)); r.end();
    } catch (e) { resolve({ s: -2, j: null, err: String(e.message) }); }
  });
}
(async () => {
  // Achar ITALY
  const emps = await R('GET', '/api/empresas');
  const lista = Array.isArray(emps.j?.data) ? emps.j.data : [];
  const italy = lista.find(e => String(e.codigo || e.sigla || '').toUpperCase() === 'E1') || null;
  const E = italy?.id || null;
  console.log('ITALY=' + E);
  if (!E) return;
  // POST criar mini OF vazia somente para testar resolução UUID (sempre retorna 400 se UUID falhar)
  const test1 = await R('POST', '/api/ofs', {
    empresa_id: E, emp_id: 'E1',
    cli_id: 'be617df1-441a-4f11-918e-f681b8d0a9e6', // RIPKE id
    clinome: 'TESTE_C1_RIPKE', descricao: 'ZZZ_TESTE_DIAG_C1_NAO_SALVAR',
    qtd: 1, ent: '2026-12-31', preco: 1, itens: []
  });
  console.log('\nTEST_C1_POST s=' + test1.s + ' ok=' + test1.j?.ok + ' err=' + String(test1.j?.error || '').slice(0, 200) + ' cliSalvo=' + String(test1.j?.data?.cli_id || '').slice(0, 24));

  // Buscar cliente RIPKE DIRETO por UUID no endpoint /api/clientes/:id
  const ri = await R('GET', '/api/clientes/be617df1-441a-4f11-918e-f681b8d0a9e6');
  const c = ri.j?.data || ri.j || null;
  console.log('\nRIPKE_by_endpoint_id GET s=' + ri.s + ' existe=' + !!c + ' id=' + String(c?.id || '').slice(0, 24) + ' nome=' + (c?.nome || '') + ' cod=' + (c?.codigo || '') + ' emp_id=' + (c?.emp_id || '') + ' empresa_id=' + String(c?.empresa_id || '').slice(0, 24));
})();
