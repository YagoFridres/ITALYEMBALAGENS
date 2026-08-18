const https = require('https');
const fs = require('fs');
const path = require('path');
let jwt;
try { jwt = require(path.join(__dirname,'node_modules','jsonwebtoken')); } catch(e) { try { jwt = require('jsonwebtoken'); } catch(e2) { console.error('jsonwebtoken not found'); process.exit(2); } }
const TOKEN = jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'2h'});
function get(p,auth){
  return new Promise((resolve)=>{
    const opts={host:'adm.italyembalagens.com.br',path:p,method:'GET',headers:{Accept:'application/json',Authorization:'Bearer '+auth},timeout:60000};
    const req=https.request(opts,res=>{let b='';res.on('data',d=>b+=d);res.on('end',()=>{try{resolve({status:res.statusCode,body:JSON.parse(b),raw:b.slice(0,2000)})}catch(e){resolve({status:res.statusCode,parseErr:e.message,raw:b.slice(0,1000)})}})});
    req.on('timeout',()=>req.destroy(new Error('timeout')));
    req.on('error',e=>resolve({netErr:String(e?.message||e)}));
    req.end();
  });
}
async function main(){
  const r1 = await get('/api/_oneshot_fix_cores_sem_impressao',TOKEN);
  const out={chamou_em:new Date().toISOString(),oneshot:r1};
  fs.writeFileSync(path.join(__dirname,'_CHAMADA_ONESHOT.json'),JSON.stringify(out,null,2));
  process.exit(r1.status===200?0:1);
}
main().catch(e=>{try{fs.writeFileSync(path.join(__dirname,'_CHAMADA_ONESHOT_ERR.json'),JSON.stringify({err:String(e?.message||e)},null,2))}catch(_){}process.exit(1)});
