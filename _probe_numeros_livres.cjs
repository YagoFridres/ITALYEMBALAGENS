const https = require('https');
const jwt = require('jsonwebtoken');
const BASE = 'https://adm.italyembalagens.com.br';
const TOKEN = jwt.sign({ id: 't', perfil: 'admin', emp_id: 'E1', sigla: 'ITALY' }, 'italy_secret_2026', { expiresIn: '12h' });
function H(method, path, body) {
  return new Promise(res => {
    const u = new URL(BASE + path);
    const opts = { method, hostname: u.hostname, port: 443, path: u.pathname + u.search, timeout: 120000, headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json', 'Accept-Encoding': 'identity', 'Cache-Control': 'no-cache' } };
    const r = https.request(opts, rsp => { let d = ''; rsp.on('data', c => d += c); rsp.on('end', () => { let j = null; try { j = d ? JSON.parse(d) : null; } catch (e) { j = { _raw: d.slice(0, 1500) }; } res({ s: rsp.statusCode, j, raw0: d.slice(0, 5000) }); }); });
    r.on('error', e => res({ s: 0, j: null, err: String(e.message) })); r.on('timeout', () => { r.destroy(); res({ s: -1, j: null, err: 'timeout' }); });
    if (body) r.write(JSON.stringify(body)); r.end();
  });
}
(async () => {
  const d = await H('GET', '/api/_diag_proxnum');
  const top15 = d.j?.res_por_resolver?.top15 || [];
  const nums = top15.map(x => ({ numero: Number(x.numero), id: String(x.id || '').slice(0, 12), emp_id: x.emp_id, clinome: String(x.clinome || '').slice(0, 20) }));
  console.log('TOP 15 GLOBAL (de _diag_proxnum):');
  nums.slice(0, 20).forEach(x => console.log('  #' + x.numero + '  emp=' + x.emp_id + '  id=' + x.id + '  ' + x.clinome));
  // Agora buscar OFs entre 2600 e 2620
  const buscar = [];
  for (let n = 2600; n <= 2620; n++) {
    try {
      const q = '/api/ofs?select=*&or=numero.eq.' + n + ',of.eq.' + n + ',of_num.eq.' + n + '&limit=5';
      const r = await H('GET', q);
      const arr = Array.isArray(r.j?.data) ? r.j.data : [];
      if (arr.length) buscar.push({ n, existe: true, qtd: arr.length, itens: arr.slice(0,2).map(o => ({ numero: o.numero, of: o.of, of_num: o.of_num, id: String(o.id||'').slice(0,12), emp_id: o.emp_id, clinome: String(o.clinome||'').slice(0,20), deleted: !!o.deleted_at })) });
      else buscar.push({ n, existe: false });
    } catch (e) { console.log('ERR', n, e); }
  }
  console.log('\nNUMEROS 2600 A 2620:');
  buscar.forEach(b => {
    if (b.existe) console.log('  #' + b.n + ' EXISTE ' + b.qtd + 'x: ' + JSON.stringify(b.itens));
    else console.log('  #' + b.n + ' LIVRE');
  });
  // E tentar um POST de C1 manual com numero LIVRE descoberto
})();
