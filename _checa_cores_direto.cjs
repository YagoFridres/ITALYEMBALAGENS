const https=require('https');const fs=require('fs');const path=require('path');const jwt=require(path.join(__dirname,'node_modules/jsonwebtoken'));const T=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'2h'});
function H(p){return new Promise((R)=>{const o={host:'adm.italyembalagens.com.br',path:p,method:'GET',headers:{Accept:'application/json',Authorization:'Bearer '+T},timeout:180000};const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{try{R({s:r.statusCode,j:JSON.parse(b),r:b})}catch(e){R({s:r.statusCode,pe:e.message,r:b.slice(0,3999)})}})});rq.on('timeout',()=>rq.destroy(new Error('to')));rq.on('error',e=>R({ne:String(e?.message||e)}));rq.end()})}
async function M(){
  const C=await H('/api/cores-impressao');
  fs.writeFileSync(path.join(__dirname,'_CORES_ATUAL.json'),JSON.stringify(C,null,2));
  if (C.s===200 && Array.isArray(C.j)){
    const sem = C.j.filter(x=>String(x?.nome||'').toLowerCase().indexOf('sem impress')>=0);
    fs.writeFileSync(path.join(__dirname,'_CORES_SEM_IMPRESSAO.json'),JSON.stringify({qtd:sem.length,items:sem},null,2));
  }
  process.exit(C.s===200?0:1);
}
M().catch(e=>{try{fs.writeFileSync(path.join(__dirname,'_ERR_CORES.txt'),String(e?.message||e))}catch(_){}process.exit(1)});
