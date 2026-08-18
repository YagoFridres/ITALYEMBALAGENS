const https = require('https');
const jwt = require('jsonwebtoken');
const TOKEN = jwt.sign({ id: 't', perfil: 'admin' }, 'italy_secret_2026', { expiresIn: '10h' });
function R(method, path, body) {
  return new Promise(resolve => {
    const u = new URL('https://adm.italyembalagens.com.br' + path);
    const opts = { method, hostname: u.hostname, port: 443, path: u.pathname + u.search, timeout: 30000, headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' } };
    const r = https.request(opts, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { let j = null; try { j = d ? JSON.parse(d) : null; } catch (e) { j = {}; } resolve({ s: res.statusCode, j, raw: d.slice(0, 4000) }); }); });
    r.on('error', e => resolve({ err: String(e.message) }));
    if (body) r.write(JSON.stringify(body)); r.end();
  });
}
(async () => {
  // Buscar RIPKE por diferentes formas:
  const r1 = await R('GET', '/api/clientes?limit=3&search=RIPKE');
  const arr1 = Array.isArray(r1.j?.data) ? r1.j.data : (Array.isArray(r1.j) ? r1.j : []);
  console.log('\nsearch=RIPKE sem empId: qtd=' + arr1.length);
  for (const c of arr1) console.log('  id=' + c.id + ' nome=' + c.nome + ' cod=' + (c.codigo || '') + ' emp_id=' + (c.emp_id || '') + ' empresa_id=' + c.empresa_id + ' ativo=' + c.ativo);
  const r2 = await R('GET', '/api/clientes?limit=5&search=RIPKE&empId=E1');
  const arr2 = Array.isArray(r2.j?.data) ? r2.j.data : (Array.isArray(r2.j) ? r2.j : []);
  console.log('\nsearch=RIPKE empId=E1: qtd=' + arr2.length);
  for (const c of arr2) console.log('  id=' + c.id + ' nome=' + c.nome + ' emp_id=' + (c.emp_id || '') + ' empresa_id=' + c.empresa_id);
  // GET direto por ID específico:
  const r3 = await R('GET', '/api/clientes/be617df1-441a-4f11-918e-f681b8d0a9e6');
  console.log('\nGET /api/clientes/RIPKE_UUID_RAW s=' + r3.s);
  console.log('raw:', JSON.stringify(r3.j).slice(0, 1200));
})();
