const https = require('https');
const jwt = require('jsonwebtoken');
const TOKEN = jwt.sign({ id: 't', perfil: 'admin', emp_id: 'E1', sigla: 'ITALY' }, 'italy_secret_2026', { expiresIn: '10h' });
function R(method, path, body) {
  return new Promise(resolve => {
    const u = new URL('https://adm.italyembalagens.com.br' + path);
    const o = { method, hostname: u.hostname, port: 443, path: u.pathname + u.search, timeout: 30000, headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' } };
    const r = https.request(o, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { let j = null; try { j = d ? JSON.parse(d) : null; } catch (e) { j = { _raw: d.slice(0, 500) }; } resolve({ s: res.statusCode, j, raw0: d.slice(0, 1500) }); }); });
    r.on('error', e => resolve({ s: 0, err: String(e.message) })); r.on('timeout', () => { r.destroy(); resolve({ s: -1, err: 'timeout' }); });
    if (body) r.write(JSON.stringify(body)); r.end();
  });
}
(async () => {
  // Buscar OFs recentes desc=ZZZ_TESTE_APAGAR_V5
  const r = await R('GET', '/api/ofs?limit=100&search=ZZZ_TESTE_APAGAR_V5');
  const arr = Array.isArray(r.j?.data) ? r.j.data : (Array.isArray(r.j) ? r.j : []);
  console.log('ZZZ encontrados=' + arr.length);
  for (const o of arr) console.log('  id=' + o.id + ' num=' + o.numero + ' del=' + !!o.deleted_at + ' desc=' + String(o.descricao || '').slice(0, 40));
  for (const o of arr.filter(x => !x.deleted_at)) {
    const d = await R('DELETE', '/api/ofs/' + o.id);
    console.log('DELETE id=' + o.id + ' num=' + o.numero + ' s=' + d.s + ' ok=' + !!d.j?.ok);
  }
  // Rodar ONESHOT
  const os = await R('POST', '/api/_oneshot_limpar_ofs_orfas_100k', {});
  console.log('ONESHOT s=' + os.s + ' j=', JSON.stringify(os.j).slice(0, 500));
  // ProxNum final
  const italyUUID = 'df5f7672-0a6b-402d-ae65-296554236c31';
  const pn = await R('GET', '/api/ofs/proximo-numero?empId=' + italyUUID);
  console.log('PROXN s=' + pn.s + ' j=', JSON.stringify(pn.j));
})();
