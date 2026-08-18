const https = require('https');
const fs = require('fs');
const path = require('path');
const jwt = require(path.join(__dirname,'node_modules','jsonwebtoken'));
const TOK = jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'2h'});

function httpsGetJSON(p, authTok){
  return new Promise((resolve)=>{
    const opts={
      host:'adm.italyembalagens.com.br',
      path:p,
      method:'GET',
      headers:{
        Accept:'application/json',
        Authorization:'Bearer '+authTok
      },
      timeout:90000
    };
    const req=https.request(opts,res=>{
      let b='';
      res.on('data',d=>b+=d);
      res.on('end',()=>{
        try{resolve({status:res.statusCode,body:JSON.parse(b),raw:b.slice(0,4000)})}
        catch(e){resolve({status:res.statusCode,parseErr:e.message,raw:b.slice(0,4000)})}
      });
    });
    req.on('timeout',()=>req.destroy(new Error('timeout')));
    req.on('error',e=>resolve({netErr:String(e?.message||e)}));
    req.end();
  });
}

async function main(){
  const log = {};
  log.inicio = new Date().toISOString();
  log.oneshot = await httpsGetJSON('/api/_oneshot_fix_cores_sem_impressao', TOK);
  log.cores_impressao = await httpsGetJSON('/api/cores-impressao', TOK);
  log.version = await httpsGetJSON('/api/version', TOK);
  log.fim = new Date().toISOString();
  const outpath = path.join(__dirname, '_ONESHOT_E_CORES_RESULTADO.json');
  fs.writeFileSync(outpath, JSON.stringify(log, null, 2));
  process.exit((log.oneshot.status===200)?0:1);
}
main().catch(e=>{
  try{fs.writeFileSync(path.join(__dirname,'_ONESHOT_ERR_CATCH.json'), JSON.stringify({err:String(e?.message||e)}, null, 2))}catch(_){}
  process.exit(1);
});
