const https = require('https');
const paths = [['/api/ofs_test?limit=1','OFS_TEST'],['/api/clientes?lite=1&search=RIPKE','CLI_RIPKE_LITE'],['/api/maquinas?lite=1','MAQ_LITE'],['/api/amostras?limit=1','AMOSTRAS'],['/api/comissoes?limit=1','COMISSOES'],['/api/cores-impressao?limit=1','CORES_IMPRESSAO']];
const HOST = 'adm.italyembalagens.com.br';
function g(p,n){
  return new Promise((resolve) => {
    const req = https.request({hostname:HOST,path:p,method:'GET',timeout:20000,headers:{'Accept':'application/json,text/plain'}},res=>{
      let d='';res.setEncoding('utf8');
      res.on('data',c=>d+=c);
      res.on('end',()=>resolve({n,code:res.statusCode,ct:res.headers['content-type']||'',len:d.length,body:d.slice(0,200)}));
    });
    req.on('error',e=>resolve({n,err:e.message}));
    req.on('timeout',()=>{req.destroy();resolve({n,err:'timeout'});});
    req.end();
  });
}
(async()=>{
  const r = await Promise.all(paths.map(([p,n])=>g(p,n)));
  r.forEach(x=>console.log(JSON.stringify(x)));
  const qtdOk = r.filter(x=>x.code===200).length;
  const qtd502 = r.filter(x=>x.code===502 || (x.err && String(x.err).includes('502'))).length;
  console.log('RESUMO: OK='+qtdOk+' 502/ERR='+qtd502+' TOTAL='+r.length);
})();
