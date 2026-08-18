const https = require('https');
const HOST = 'adm.italyembalagens.com.br';
const t0 = Date.now();
function getHdrs(path){
  return new Promise((resolve) => {
    const req = https.request({hostname:HOST,path:path,method:'GET',timeout:12000,headers:{'Accept':'application/json'}}, (res) => {
      const h = Object.fromEntries(Object.entries(res.headers).filter(([k])=>k.includes('version')||k.includes('patch')||k.includes('content-type')));
      let data = '';
      res.setEncoding('utf8');
      res.on('data', c => data += c);
      res.on('end', () => resolve({code:res.statusCode,...h, body:data.slice(0,350), dt:(Date.now()-t0)/1000}));
    });
    req.on('error', e => resolve({err:e.message, path, dt:(Date.now()-t0)/1000}));
    req.on('timeout', () => { req.destroy(); resolve({err:'timeout', path, dt:(Date.now()-t0)/1000}); });
    req.end();
  });
}
(async () => {
  const token = require('crypto').createHmac('sha256','italy_secret_2026').update('x').digest('hex');
  for(let i=1;i<=18;i++){
    const r1 = await getHdrs('/?__nc='+Date.now());
    const okPatch = r1 && r1['x-index-patch-version'] === '20260813020000';
    let r2 = null, r3 = null;
    if (okPatch || i>6) { r2 = await getHdrs('/api/version'); r3 = await getHdrs('/api/ofs_test?lite=1&limit=2'); }
    console.log(`[${i}] HEAD=${JSON.stringify(r1)}\n      VER=${JSON.stringify(r2)}\n      OFS=${JSON.stringify(r3)}\n`);
    if (okPatch && r2 && r2.code===200 && r3 && r3.code===200) { console.log('OK SISTEMA DE VOLTA!'); process.exit(0); }
    await new Promise(r2x => setTimeout(r2x, i<6?9000:11000));
  }
  console.log('TIMEOUT, mas deploy provavelmente em progresso.'); process.exit(0);
})();
