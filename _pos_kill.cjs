const https=require('https');const fs=require('fs');const path=require('path');const jwt=require(path.join(__dirname,'node_modules/jsonwebtoken'));const T=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'2h'});const p=__dirname;
function step(n,s){try{fs.writeFileSync(path.join(p,'_pk_s'+n+'.txt'),String(s||''))}catch(_){}}
function H(u,n,tm,auth){return new Promise(R=>{
  step(n,'start_url='+u);
  const t0=Date.now();
  const hdr={Accept:'application/json','Cache-Control':'no-cache'};
  if(auth)hdr.Authorization='Bearer '+T;
  const o={host:'adm.italyembalagens.com.br',path:u,method:'GET',headers:hdr,timeout:tm||25000};
  const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{const ms=Date.now()-t0;step(n,'end_s='+r.statusCode+'_ms='+ms);let j;try{j=JSON.parse(b)}catch(e){j={pe:e.message,r:b.slice(0,2000)}}try{fs.writeFileSync(path.join(p,'_pk_r'+n+'.json'),JSON.stringify({ms,s:r.statusCode,j,raw:b.slice(0,4000)},null,2))}catch(_){}R({ms,s:r.statusCode,j,raw:b.slice(0,2000)})})});
  rq.setTimeout(tm||25000,()=>{step(n,'timeout');rq.destroy(new Error('to'))});
  rq.on('error',e=>{step(n,'err='+String(e?.message||e));try{fs.writeFileSync(path.join(p,'_pk_e'+n+'.json'),JSON.stringify({err:e.message},null,2))}catch(_){}R({ne:String(e?.message||e)})});
  rq.end();
});}
async function M(){
  step(0,'boot_'+new Date().toISOString());
  const R = [
    await H('/api/ofs_test',1,25000,false),
    await H('/api/empresas',2,25000,true),
    await H('/api/_oneshot_fix_cores_sem_impressao',3,45000,true),
    await H('/api/cores-impressao',4,25000,true),
  ];
  try{fs.writeFileSync(path.join(p,'_PK_RESULTADO.json'),JSON.stringify({feito_em:new Date().toISOString(),R},null,2))}catch(_){}
  step(9,'fim');
  process.exit(0);
}
M().catch(e=>{try{fs.writeFileSync(path.join(p,'_PK_ERR_MAIN.txt'),String(e?.message||e))}catch(_){}process.exit(1)});
