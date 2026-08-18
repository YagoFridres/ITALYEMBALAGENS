const jwt = require('jsonwebtoken');
const secret = 'italy_secret_2026';
const token = jwt.sign({ id:'t', perfil:'admin' }, secret, { expiresIn:'1h' });
const https = require('https');

const Q = 'RIPKE';
const path = '/api/clientes?q=' + encodeURIComponent(Q) + '&order=nome&dir=asc'; // cacheKey NOVA!
const opts = { host:'adm.italyembalagens.com.br', path, method:'GET', headers:{ 'Authorization':'Bearer '+token }, timeout: 90000 };
const req = https.request(opts, res => {
  let b = '';
  res.on('data', d => b += d);
  res.on('end', () => {
    console.log('[HTTP', res.statusCode, 'len=' + b.length + ']');
    try {
      const d = JSON.parse(b);
      const arr = Array.isArray(d?.data) ? d.data : (Array.isArray(d)?d:[]);
      const c = arr.find(x => String(x?.nome||x?.rs||'').toUpperCase().includes('RIPKE'));
      console.log('found=', !!c, 'nome=', c?.nome, 'id=', c?.id);
      console.log('total_ofs LISTAGEM =', c?.total_ofs, '(esperado 422)');
      console.log('cacheStatus (header):', res.headers['x-cache'] || 'sem header x-cache');
    } catch(e) {
      console.log('PARSE ERR', e.message, '\nBODY[:800]:', b.slice(0,800));
    }
    process.exit(0);
  });
});
req.on('timeout', () => { console.error('TIMEOUT 90s'); req.destroy(new Error('timeout')); });
req.on('error', e => { console.error('NET ERR', e.message); process.exit(1); });
req.end();
