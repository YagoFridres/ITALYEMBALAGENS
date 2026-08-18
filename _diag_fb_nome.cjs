const https=require('https');const jwt=require('jsonwebtoken');const fs=require('fs');const T=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'8h'});const EU='df5f7672-0a6b-402d-ae65-296554236c31';
function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim()}
function GET(url){return new Promise(res=>{const hdr={Accept:'application/json','Cache-Control':'no-cache',Authorization:'Bearer '+T};const o={host:'adm.italyembalagens.com.br',port:443,method:'GET',path:url,headers:hdr,timeout:120000};const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{let j=null;try{j=JSON.parse(b)}catch(e){}res({s:r.statusCode,j:j,b:b.slice(0,2000)})})});rq.setTimeout(120000,()=>{try{rq.destroy()}catch(e){}res({ne:'T'})});rq.on('error',e=>res({ne:String(e.message||e)}));rq.end()})}
(async()=>{
  const out={};
  // 1) /api/clientes sem filtro (tem RIPKE?)
  const r1=await GET('/api/clientes?search=RIPKE&limit=5&nc='+Date.now());
  out.r1={s:r1.s,qtd:Array.isArray(r1.j?.data)?r1.j.data.length:(Array.isArray(r1.j)?r1.j.length:0),first:Array.isArray(r1.j?.data)?r1.j.data[0]:(Array.isArray(r1.j)?r1.j[0]:null)};
  if(out.r1.first){const c=out.r1.first;out.r1.resumo={id:c.id?.slice(0,14),nome:c.nome,emp_id:c.emp_id,empresa_id:(c.empresa_id||'').slice(0,12)}}
  // 2) /api/clientes com empId=UUID (o modo que o frontend usa para datalist)
  const r2=await GET('/api/clientes?empId='+encodeURIComponent(EU)+'&search=RIPKE&limit=10&nc='+Date.now());
  out.r2={s:r2.s,qtd:Array.isArray(r2.j?.data)?r2.j.data.length:(Array.isArray(r2.j)?r2.j.length:0),todos:Array.isArray(r2.j?.data)?r2.j.data.map(x=>({id:x.id?.slice(0,12),nome:x.nome,emp_id:x.emp_id,empresa_id:(x.empresa_id||'').slice(0,10)})):(Array.isArray(r2.j)?r2.j.map(x=>({id:x.id?.slice(0,12),nome:x.nome,emp_id:x.emp_id,empresa_id:(x.empresa_id||'').slice(0,10)})):[])};
  // 3) /api/clientes com empId=UUID SEM search = lista todos clientes da empresa para ver se RIPKE aparece em fallback nome
  const r3=await GET('/api/clientes?empId='+encodeURIComponent(EU)+'&limit=500&nc='+Date.now());
  const arr3=Array.isArray(r3.j?.data)?r3.j.data:(Array.isArray(r3.j)?r3.j:[]);
  out.r3={s:r3.s,total:arr3.length,names:arr3.map(x=>x.nome||'null').slice(0,20),tem_ripke_norm:arr3.some(x=>norm(x.nome||'')===norm('MOVEIS RIPKE')),qtd_moveis:arr3.filter(x=>norm(x.nome||'').includes('moveis')).length,moveis_list:arr3.filter(x=>norm(x.nome||'').includes('moveis')).map(x=>({nome:x.nome,id:x.id?.slice(0,12)}))};
  fs.writeFileSync('_DIAG_FB_NOME.json',JSON.stringify(out,null,2));
  console.log(JSON.stringify(out,null,2));
  process.exit(0);
})().catch(e=>{fs.writeFileSync('_DIAG_FB_NOME_ERR.txt',String(e.message||e));process.exit(2);});
