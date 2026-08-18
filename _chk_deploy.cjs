const https = require('https');
const opts = {
  host:'adm.italyembalagens.com.br', path:'/api/version', method:'GET', timeout: 15000,
  headers:{'Accept':'application/json'}
};
const t0 = Date.now();
const req = https.request(opts, (res) => {
  let b = '';
  res.on('data', d => b += d);
  res.on('end', () => {
    try {
      const d = JSON.parse(b);
      console.log('HTTP', res.statusCode);
      console.log('patch:', d?.runtime?.patch);
      console.log('sw:', d?.runtime?.sw);
      console.log('cache_name:', d?.runtime?.sw_cache_name);
      console.log('TEMPO', Date.now()-t0, 'ms');
      const esperado = '20260811213000';
      const match = String(d?.runtime?.patch||'') === esperado;
      console.log('PROMPT2_DEPLOYADO:', match ? 'SIM ✅' : 'NAO ❌ (ainda = ' + d?.runtime?.patch + ')');
      process.exit(match ? 0 : 1);
    } catch(e) { console.log('ERR parse', e.message, b.slice(0,300)); process.exit(2);}
  });
});
req.on('timeout', () => { req.destroy(); process.exit(3); });
req.on('error', e => { console.log('NET', e.message); process.exit(4); });
req.end();