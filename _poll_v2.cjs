const https=require('https');const jwt=require('jsonwebtoken');const T=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'3h'});const path=require('path');const fs=require('fs');
const GET=(u,tm)=>new Promise(R=>{const t0=Date.now();const hdr={Accept:'application/json','Cache-Control':'no-cache',Authorization:'Bearer '+T};const o={host:'adm.italyembalagens.com.br',port:443,path:u,method:'GET',headers:hdr,timeout:tm||60000};const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{let j;try{j=JSON.parse(b)}catch(e){j={pe:e.message,r:b.slice(0,2000)}};R({ms:Date.now()-t0,s:r.statusCode,j});});});rq.setTimeout(tm||60000,()=>{try{rq.destroy();}catch(_){}R({ne:'TIMEOUT'});});rq.on('error',e=>R({ne:String(e?.message||e)}));rq.end();});
(async()=>{
  const alvo='20260812105000';
  const res=[];
  let last=null;
  for(let i=1;i<=24;i++){
    const r=await GET('/api/version?nc='+Date.now()+'_'+i,18000);
    const pv=String(r?.j?.runtime?.patch||r?.j?.runtime?.sw||r?.j?.runtime?.patch_version||'').trim();
    const com=String(r?.j?.git?.commit||'').slice(0,7);
    const ok=(pv===alvo||com==='305af98');
    last={i,s:r.s,ms:r.ms,pv,com,ok};
    res.push(last);
    if(ok){break;}
    console.log('rodada',String(i).padStart(2,'0'),'PATCH=',JSON.stringify(pv),'COMMIT=',com,'HTTP',r.s);
    await new Promise(rr=>setTimeout(rr,2200));
  }
  console.log('\n=== DEPLOY CONCLUIDO? ===');
  console.log('ULTIMA RODADA:', JSON.stringify(last,null,2));
  // 2) PRÓXIMO NÚMERO
  console.log('\n=== PRÓXIMO NÚMERO DE OF ===');
  const pn=await GET('/api/ofs/proximo-numero?nc='+Date.now(),60000);
  console.log(JSON.stringify({status:pn.s,ms:pn.ms,body:pn.j||null},null,2));
  // 3) /api/ofs?limit=3 order by numero desc - confirma deleted_at null
  console.log('\n=== LISTA TOP OFS (deleted_at null obrigatorio) ===');
  const top=await GET('/api/ofs?limit=5&offset=0&nocache='+Date.now(),60000);
  const data=(top.j?.data||top.j||[]).slice(0,5);
  console.log(JSON.stringify({
    status: top.s, ms: top.ms,
    qtd: data.length,
    idsNumeros: data.map(o=>String(o?.numero||o?.of||'?')+' id='+String(o?.id||'').slice(0,8)+' del='+!!o?.deleted_at)
  },null,2));
  try{fs.writeFileSync(path.join(__dirname,'_DEPLOY_OK.json'),JSON.stringify({res,last,pn:pn?.j,top:data.map(o=>({num:o?.numero,id:o?.id,del:!!o?.deleted_at}))},null,2));}catch(_){}
  process.exit(0);
})().catch(e=>{console.error('CATCH',e?.message||e);process.exit(2);});
