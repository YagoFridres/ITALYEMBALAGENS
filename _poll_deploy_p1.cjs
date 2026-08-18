const https = require('https');
const fs = require('fs');
const path = require('path');
const ESPERADO = '20260812093200';
const MAX_TENT = 60;
const INTERVALO_MS = 5000;

function get(p){
  return new Promise((resolve)=>{
    const opts={host:'adm.italyembalagens.com.br',path:p,method:'GET',headers:{Accept:'application/json'},timeout:30000};
    const req=https.request(opts,res=>{let b='';res.on('data',d=>b+=d);res.on('end',()=>{try{resolve({status:res.statusCode,body:JSON.parse(b),raw:b.slice(0,1000)})}catch(e){resolve({status:res.statusCode,parseErr:e.message,raw:b.slice(0,500)})}})});
    req.on('timeout',()=>req.destroy(new Error('timeout')));
    req.on('error',e=>resolve({netErr:String(e?.message||e)}));
    req.end();
  });
}

async function main(){
  const out={esperado:ESPERADO,tentativas:[],deploy_ok:false,versao_final:null};
  for(let i=1;i<=MAX_TENT;i++){
    const r = await get('/api/version');
    const patch = String(r?.body?.runtime?.patch ?? r?.body?.patch ?? '');
    out.tentativas.push({n:i, status:r.status, patch_obtido:patch, match:patch===ESPERADO, netErr:r.netErr||null, parseErr:r.parseErr||null});
    if(patch===ESPERADO){out.deploy_ok=true;out.versao_final=r.body;break;}
    await new Promise(r=>setTimeout(r,INTERVALO_MS));
  }
  fs.writeFileSync(path.join(__dirname,'_POLL_DEPLOY_P1.json'),JSON.stringify(out,null,2));
  process.exit(out.deploy_ok?0:1);
}
main().catch(e=>{try{fs.writeFileSync(path.join(__dirname,'_POLL_DEPLOY_P1_ERR.json'),JSON.stringify({err:String(e?.message||e)},null,2))}catch(_){}process.exit(1)});
