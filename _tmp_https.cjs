const https = require('https');
const jwt = require('jsonwebtoken');
const token = jwt.sign({ id:'t', perfil:'admin' }, 'italy_secret_2026', { expiresIn:'1h' });

const id = 'be617df1-441a-4f11-918e-d813a5ac854c';
const opts = {
  host: 'adm.italyembalagens.com.br',
  path: '/api/clientes/' + id + '/painel',
  method: 'GET',
  headers: { 'Authorization':'Bearer '+token, 'Content-Type':'application/json' }
};
const req = https.request(opts, (res) => {
  let b = '';
  res.on('data', d => b += d.toString());
  res.on('end', () => {
    console.log('HTTP', res.statusCode);
    console.log('HEADERS', JSON.stringify(res.headers, null, 2).slice(0,300));
    try {
      const d = JSON.parse(b);
      let total = Number(d?.total_ofs || 0);
      if (!total && Array.isArray(d?.todas)) total = d.todas.length;
      console.log('RIPKE total_ofs =', total, '(esperado 422)');
      console.log('sample keys:', Object.keys(d).slice(0,8));
    } catch(e) {
      console.log('BODY (first 600):', b.slice(0,600));
    }
    process.exit(0);
  });
});
req.on('error', e => { console.error('ERR', e.message); process.exit(1); });
req.end();
