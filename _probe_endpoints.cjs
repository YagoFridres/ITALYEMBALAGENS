const https = require('https');
const HOST = 'adm.italyembalagens.com.br';
function get(path){
  return new Promise((resolve) => {
    const req = https.request({hostname:HOST,path,method:'GET',timeout:15000,headers:{'Accept':'application/json,text/plain'}}, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', c => data += c);
      res.on('end', () => resolve({code:res.statusCode, ct:res.headers['content-type']||'', body:data.slice(0,500)}));
    });
    req.on('error', e => resolve({err:e.message}));
    req.on('timeout', () => { req.destroy(); resolve({err:'timeout'}); });
    req.end();
  });
}
(async () => {
  const t=Date.now();
  console.log('>>> Raiz (HEADERS)', JSON.stringify(await get('/?__nc='+Date.now())));
  console.log('>>> /api/version', JSON.stringify(await get('/api/version')));
  console.log('>>> /api/ofs_test?limit=1', JSON.stringify(await get('/api/ofs_test?limit=1')));
  console.log('>>> /api/clientes?lite=1&search=RIPKE', JSON.stringify(await get('/api/clientes?lite=1&search=RIPKE')));
  console.log('TOTAL (s):', ((Date.now()-t)/1000).toFixed(1));
})();
