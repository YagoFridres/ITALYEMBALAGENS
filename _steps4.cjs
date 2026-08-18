const https=require('https');const fs=require('fs');const path=require('path');const jwt=require(path.join(__dirname,'node_modules/jsonwebtoken'));const T=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'2h'});const p=__dirname;
function step(n,c){fs.writeFileSync(path.join(p,'_s'+n+'.txt'),String(c||''));}
function H(u,n,tm){return new Promise(R=>{
  step(n,'URL='+u+' start '+Date.now());
  const o={host:'adm.italyembalagens.com.br',path:u,method:'GET',headers:{Accept:'application/json',Authorization:'Bearer '+T},timeout:tm||60000};
  const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{try{R({s:r.statusCode,j:JSON.parse(b),r:b.slice(0,4000)})}catch(e){R({s:r.statusCode,pe:e.message,r:b.slice(0,4000)})}})});
  rq.setTimeout(tm||60000,()=>{step(n,'_TO');rq.destroy(new Error('to'))});
  rq.on('error',e=>{step(n,'_NE='+String(e?.message||e));R({ne:String(e?.message||e)})});
  rq.end();
}).then(r=>{step(n,'_HTTP_'+r.s+'_'+Date.now());fs.writeFileSync(path.join(p,'_s'+n+'_resp.json'),JSON.stringify(r,null,2));return r});
}
async function M(){
  step(0,'START');
  const A=await H('/api/version',1);
  const B=await H('/api/empresas',2);
  const C=await H('/api/_oneshot_fix_cores_sem_impressao',3,120000);
  const D=await H('/api/_oneshot_fix_cores_sem_impressao',4,60000);
  fs.writeFileSync(path.join(p,'_FINAL.json'),JSON.stringify({A,B,C,D},null,2));
  step(9,'DONE');
  process.exit(0);
}
M().catch(e=>{step(9,'CATCH_'+String(e?.message||e));process.exit(1)});
