const https = require('https');
const jwt = require('jsonwebtoken');
const TOKEN = jwt.sign({ id: 't', perfil: 'admin' }, 'italy_secret_2026', { expiresIn: '5h' });
function R(path) {
  return new Promise(resolve => {
    const o = { hostname: 'adm.italyembalagens.com.br', path: path, port: 443, timeout: 25000, headers: { 'Authorization': 'Bearer ' + TOKEN } };
    const r = https.request(o, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => {
        let j = null; try { j = d ? JSON.parse(d) : null; } catch (e) { j = { _raw: d.slice(0, 500) }; }
        resolve(j);
      });
    });
    r.on('error', e => resolve({ err: e.message }));
    r.on('timeout', () => { r.destroy(); resolve({ timeout: true }); });
    r.end();
  });
}
(async () => {
  const paths = [
    '/api/clientes?limit=5&search=RIPKE',
    '/api/clientes?limit=5&search=RIPKE&empId=E1',
    '/api/clientes?limit=5&search=RIPKE&empId=df5f7672-798e-4a6e-9393-3d46ed2d0d1f'
  ];
  for (const p of paths) {
    const j = await R(p);
    const arr = Array.isArray(j?.data) ? j.data : (Array.isArray(j) ? j : []);
    console.log('\nPATH=' + p + ' qtd=' + arr.length);
    for (const c of arr.slice(0, 3)) {
      console.log('  id=' + String(c.id || '').slice(0, 24) + ' nome=' + (c.nome || '') + ' cod=' + (c.codigo || '') + ' emp_id=' + (c.emp_id || '') + ' empresa_id=' + String(c.empresa_id || '').slice(0, 24) + ' ativo=' + c.ativo);
    }
  }
})();
