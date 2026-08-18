const https=require('https');const fs=require('fs');const path=require('path');const p=__dirname;
function H(u,tm){return new Promise(R=>{
  const t0=Date.now();
  const o={host:'adm.italyembalagens.com.br',path:u,method:'GET',headers:{Accept:'application/json','Cache-Control':'no-cache'},timeout:tm||60000};
  const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{const ms=Date.now()-t0;try{R({lat_ms:ms,s:r.statusCode,j:JSON.parse(b),r:b.slice(0,1000)})}catch(e){R({lat_ms:ms,s:r.statusCode,pe:e.message,r:b.slice(0,1000)})}})});
  rq.setTimeout(tm||60000,()=>{rq.destroy(new Error('to'))});
  rq.on('error',e=>{const ms=Date.now()-t0;R({lat_ms:ms,ne:String(e?.message||e)})});
  rq.end();
});}
async function M(){
  const runs=[];
  const seq=['/api/health','/api/version','/api/ofs_test','/api/version','/api/ofs_test'];
  for(let i=0;i<seq.length;i++){
    runs.push({i,u:seq[i],r:await H(seq[i],40000)});
    fs.writeFileSync(path.join(p,'_HEALTH.json'),JSON.stringify({i_running:i,runs},null,2));
  }
  fs.writeFileSync(path.join(p,'_HEALTH.json'),JSON.stringify({done_at:new Date().toISOString(),runs},null,2));
  process.exit(0);
}
M().catch(e=>{try{fs.writeFileSync(path.join(p,'_HEALTH_ERR.txt'),'M_'+String(e?.message||e))}catch(_){}process.exit(1)});
