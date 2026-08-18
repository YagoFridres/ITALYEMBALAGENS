const https = require('https');
const HOST = 'adm.italyembalagens.com.br';
const t0 = Date.now();
function hdrs(){
  return new Promise((resolve) => {
    const req = https.request({hostname:HOST,path:'/?__nc='+Date.now(),method:'HEAD',timeout:12000}, (res) => {
      const h = Object.fromEntries(Object.entries(res.headers).filter(([k])=>k.includes('version')||k.includes('patch')||k.includes('sw')));
      resolve({code:res.statusCode,...h, dt:(Date.now()-t0)/1000});
    });
    req.on('error', e => resolve({err:e.message, dt:(Date.now()-t0)/1000}));
    req.on('timeout', () => { req.destroy(); resolve({err:'timeout'}); });
    req.end();
  });
}
(async () => {
  for(let i=1;i<=24;i++){
    const r = await hdrs();
    console.log(`[${i}]`, JSON.stringify(r));
    if (r && r['x-index-patch-version'] === '20260813030000') { console.log('OK DEPLOY NOVO ATIVO'); break; }
    await new Promise(r2 => setTimeout(r2, 7000));
  }
})();
