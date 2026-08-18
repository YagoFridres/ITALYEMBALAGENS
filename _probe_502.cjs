const https = require('https');
const HOST = 'adm.italyembalagens.com.br';
function call(n,p,timeout){
  return new Promise((resolve) => {
    const t = setTimeout(()=>{req.destroy();resolve({n,err:'TIMEOUT_'+timeout});}, timeout||8000);
    const req = https.request({hostname:HOST,path:p,method:'GET',timeout:timeout||8000,headers:{'Accept':'application/json'}},res=>{
      clearTimeout(t);
      let d='';res.setEncoding('utf8');res.on('data',c=>d+=c);
      res.on('end',()=>resolve({n,code:res.statusCode,len:d.length,ok:res.statusCode>=200&&res.statusCode<400,body:d.slice(0,150)}));
    });
    req.on('error',e=>{clearTimeout(t);resolve({n,err:e.message});});
    req.end();
  });
}
(async()=>{
  const results = await Promise.all([
    call('OFS_LITE_2','/api/ofs?lite=1&limit=2',9000),
    call('MAQ_LITE','/api/maquinas?lite=1',9000),
    call('AMOSTRAS_1','/api/amostras?limit=1',9000),
    call('CORES','/api/cores-impressao?limit=1&lite=1',9000),
    call('CLIENTES_LITE','/api/clientes?lite=1&search=RIPKE',20000)
  ]);
  results.forEach(r=>console.log(JSON.stringify(r)));
  const ok = results.filter(r=>r.ok).length;
  console.log('OK='+ok+'/'+results.length);
})();
