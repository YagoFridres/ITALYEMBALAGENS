const https=require('https');const fs=require('fs');const path=require('path');const jwt=require(path.join(__dirname,'node_modules/jsonwebtoken'));const T=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'2h'});const p=__dirname;
const PATCH_ESPERADO='20260812102200';
function step(n,s){try{fs.writeFileSync(path.join(p,'_p2_s'+n+'.txt'),String(s||''))}catch(_){}}
function H(u,tm,auth){return new Promise(R=>{
  const t0=Date.now();const hdr={Accept:'application/json','Cache-Control':'no-cache'};if(auth)hdr.Authorization='Bearer '+T;
  const o={host:'adm.italyembalagens.com.br',path:u,method:'GET',headers:hdr,timeout:tm||60000};
  const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{const ms=Date.now()-t0;let j;try{j=JSON.parse(b)}catch(e){j={pe:e.message,r:b.slice(0,2000)}}R({ms,s:r.statusCode,j,raw:b.slice(0,4000)})})});
  rq.setTimeout(tm||60000,()=>rq.destroy(new Error('to')));
  rq.on('error',e=>R({ne:String(e?.message||e)}));rq.end();
});}
async function pollDeploy(){for(let i=1;i<=40;i++){step(1,'poll_'+i+'_'+new Date().toISOString());const v=await H('/api/version',15000,false);step(2,'poll_'+i+'_s='+v.s+'_patch='+(v?.j?.runtime?.patch||'?'));if(v.s===200 && v.j && v.j.runtime && v.j.runtime.patch===PATCH_ESPERADO){return true;}await new Promise(r=>setTimeout(r,10000));}return false;}
async function M(){
  step(0,'BOOT target='+PATCH_ESPERADO);
  const ok=await pollDeploy();
  step(3,'DEPLOY_OK='+ok);
  let O=null,C=null;
  if(ok){
    O=await H('/api/_oneshot_fix_cores_sem_impressao',60000,true);
    C=await H('/api/cores-impressao',30000,true);
  }
  try{fs.writeFileSync(path.join(p,'_P2_RESULTADO.json'),JSON.stringify({deploy_ok:ok,esperado:PATCH_ESPERADO,oneshot:O,cores:C,feito_em:new Date().toISOString()},null,2))}catch(_){}
  process.exit(ok?0:1);
}
M().catch(e=>{try{fs.writeFileSync(path.join(p,'_P2_ERR.txt'),String(e?.message||e))}catch(_){}process.exit(1)});
