const https=require('https');const fs=require('fs');const path=require('path');const jwt=require(path.join(__dirname,'node_modules/jsonwebtoken'));const T=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'2h'});
function H(p){return new Promise((R)=>{const o={host:'adm.italyembalagens.com.br',path:p,method:'GET',headers:{Accept:'application/json',Authorization:'Bearer '+T},timeout:90000};const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{try{R({s:r.statusCode,j:JSON.parse(b),r:b})}catch(e){R({s:r.statusCode,pe:e.message,r:b.slice(0,9999)})}})});rq.on('timeout',()=>rq.destroy(new Error('to')));rq.on('error',e=>R({ne:String(e?.message||e)}));rq.end()})}
function S(fn,c){fs.writeFileSync(path.join(__dirname,fn),c)}
async function M(){
console.log('M1_START_'+Date.now());
const V=await H('/api/version');console.log('M2_VERS_HTTP='+V.s);S('_t_vers.json',JSON.stringify(V,null,2));
const O=await H('/api/_oneshot_fix_cores_sem_impressao');console.log('M3_ONESHOT_HTTP='+O.s);S('_t_oneshot.json',JSON.stringify(O,null,2));
const C=await H('/api/cores-impressao');console.log('M4_CORES_HTTP='+C.s);S('_t_cores.json',JSON.stringify(C,null,2));
const O2=await H('/api/_oneshot_fix_cores_sem_impressao');console.log('M5_ONESHOT2_HTTP='+O2.s);S('_t_oneshot2.json',JSON.stringify(O2,null,2));
console.log('M9_END_OK');process.exit(0);
}
M().catch(e=>{console.log('MERR_'+String(e?.message||e));process.exit(1)});
