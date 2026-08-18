const https=require('https');const jwt=require('jsonwebtoken');const fs=require('fs');const T=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'6h'});
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const GET=(u,tm)=>new Promise(R=>{const hdr={Accept:'application/json','Cache-Control':'no-cache',Authorization:'Bearer '+T};const o={host:'adm.italyembalagens.com.br',port:443,path:u,method:'GET',headers:hdr,timeout:tm||120000};const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{try{R({s:r.statusCode,j:JSON.parse(b),b})}catch(e){R({s:r.statusCode,b,j:null})}});});rq.setTimeout(tm||120000,()=>{try{rq.destroy()}catch(_){}R({ne:'T'})});rq.on('error',e=>R({ne:String(e?.message||e)}));rq.end()});
(async()=>{
  const out={};
  // Testa /api/clientes?empId=UUID_RIPKE&search=RIPKE (deve retornar 1+ cliente)
  const EU='df5f7672-0a6b-402d-ae65-296554236c31';
  const r1=await GET('/api/clientes?empId='+encodeURIComponent(EU)+'&search=RIPKE&limit=20&nc='+Date.now(),120000);
  out.r1={s:r1.s,qtd:r1.j?.data?.length||r1.j?.length||0,clientes:(r1.j?.data||r1.j||[]).map(x=>({id:x.id?.slice(0,12),nome:x.nome,emp_id:x.emp_id,empresa_id:(x.empresa_id||'').slice(0,10),codigo:x.codigo,ativo:x.ativo}))};
  // Testa /api/clientes?empId=UUID_RIPKE&search=MOVEIS (nome normalizado)
  const r2=await GET('/api/clientes?empId='+encodeURIComponent(EU)+'&search=MOVEIS&limit=20&nc='+Date.now(),120000);
  out.r2={s:r2.s,qtd:r2.j?.data?.length||r2.j?.length||0,clientes:(r2.j?.data||r2.j||[]).map(x=>({id:x.id?.slice(0,12),nome:x.nome,emp_id:x.emp_id,empresa_id:(x.empresa_id||'').slice(0,10),codigo:x.codigo,ativo:x.ativo}))};
  // Testa com search=MÓVEIS RIPKE (com acento)
  const r3=await GET('/api/clientes?empId='+encodeURIComponent(EU)+'&search='+encodeURIComponent('MÓVEIS RIPKE')+'&limit=20&nc='+Date.now(),120000);
  out.r3={s:r3.s,qtd:r3.j?.data?.length||r3.j?.length||0,clientes:(r3.j?.data||r3.j||[]).map(x=>({id:x.id?.slice(0,12),nome:x.nome,emp_id:x.emp_id,empresa_id:(x.empresa_id||'').slice(0,10),codigo:x.codigo,ativo:x.ativo}))};
  // Testa fallback nome via POST OF (para ver se modo = nome_exato retorna 200): enviar cliente_id = MOVEIS RIPKE (SEM acento, uppercase exato igual banco)
  fs.writeFileSync('_R1_R3.json',JSON.stringify(out,null,2));
  console.log(JSON.stringify(out,null,2));
  process.exit(0);
})().catch(e=>{fs.writeFileSync('_R1_ERR.txt',String(e.message||e));process.exit(2);});
