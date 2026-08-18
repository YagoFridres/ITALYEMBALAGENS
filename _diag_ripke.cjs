const https=require('https');const jwt=require('jsonwebtoken');const path=require('path');const fs=require('fs');const T=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'3h'});
const GET=(u,tm)=>new Promise(R=>{const t0=Date.now();const hdr={Accept:'application/json','Cache-Control':'no-cache',Authorization:'Bearer '+T};const o={host:'adm.italyembalagens.com.br',port:443,path:u,method:'GET',headers:hdr,timeout:tm||60000};const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{let j;try{j=JSON.parse(b)}catch(e){j={pe:e.message,r:b.slice(0,2000)}};R({ms:Date.now()-t0,s:r.statusCode,j});});});rq.setTimeout(tm||60000,()=>{try{rq.destroy();}catch(_){}R({ne:'TIMEOUT'});});rq.on('error',e=>R({ne:String(e?.message||e)}));rq.end();});
(async()=>{
  const out={};
  // listar todos clientes
  out.clientes=(await GET('/api/clientes?limit=800&nocache='+Date.now(),60000)).j;
  let arr=[];
  if(Array.isArray(out.clientes?.data))arr=out.clientes.data;
  else if(Array.isArray(out.clientes))arr=out.clientes;
  // achar RIPKE normalizado
  const norm=(s)=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
  const matches=arr.filter(o=>norm(o?.nome||o?.razao_social||o?.nome_fantasia||'').includes('ripke')).map(o=>({id:o.id?.slice(0,12)+'...',nome:o.nome||o.razao_social||o.nome_fantasia||'',empresa_id:o.empresa_id||o.emp_id||'',deleted:!!o.deleted_at,status:o.status||null}));
  out.ripkes=matches;
  // listar empresas
  out.empresas=(await GET('/api/empresas?nocache='+Date.now(),60000)).j;
  try{fs.writeFileSync(path.join(__dirname,'_DIAG_RIPKE.json'),JSON.stringify(out,null,2));}catch(e){}
  console.log(JSON.stringify({count_clientes:arr.length,matches},null,2));
  process.exit(0);
})().catch(e=>{console.error('ERR',e?.message||e);process.exit(2);});
