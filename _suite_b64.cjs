const https=require('https');const jwt=require('jsonwebtoken');const fs=require('fs');
const B64_S=(b)=>Buffer.from(b,'base64').toString('utf8');
// casos em base64 UTF8:
// "MOVEIS RIPKE" (sem acento) = TU9WRUlTIFJJUEtF
// "MÓVEIS RIPKE" (Ó acento agudo maiusculo UTF-8) = TsOXVkVJUyBSSVBLRQ==
// "moveis ripke" (minusculo sem acento) = bW92ZWlzIHJpcGtl
// "cliente xablau 9999" = Y2xpZW50ZSB4YWJsYXUgOTk5OQ==
// "moveis" = bW92ZWlz
const STR={
  RIPKE_SEMACENTO_MAIUSC: B64_S('TU9WRUlTIFJJUEtF'),
  RIPKE_COM_ACENTO_MAIUSC: B64_S('TcOTVkVJUyBSSVBLRQ=='),
  RIPKE_SEMACENTO_MINUSC: B64_S('bW92ZWlzIHJpcGtl'),
  INEXISTENTE: B64_S('Y2xpZW50ZSB4YWJsYXUgOTk5OQ=='),
  AMBIGUO: B64_S('bW92ZWlz'),
};
const T=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'8h'});
const EU='df5f7672-0a6b-402d-ae65-296554236c31';const VEND='b362b262-0b8f-40e3-865f-7eb5bfe226c8';const RIPKE_ID='be617df1-441a-4f11-918e-d813a5ac854c';
function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim()}
function POST(body){return new Promise(res=>{const bdy=JSON.stringify(body);const hdr={Accept:'application/json','Cache-Control':'no-cache',Authorization:'Bearer '+T,'Content-Type':'application/json','Content-Length':Buffer.byteLength(bdy)};const o={host:'adm.italyembalagens.com.br',port:443,method:'POST',path:'/api/ofs',headers:hdr,timeout:240000};const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{let j=null;try{j=JSON.parse(b)}catch(e){}res({s:r.statusCode,j:j,b:b.slice(0,2000)})})});rq.setTimeout(240000,()=>{try{rq.destroy()}catch(e){}res({ne:'T'})});rq.on('error',e=>res({ne:String(e.message||e)}));rq.write(bdy);rq.end()})}
function DEL(id){return new Promise(res=>{const hdr={Accept:'application/json','Cache-Control':'no-cache',Authorization:'Bearer '+T};const o={host:'adm.italyembalagens.com.br',port:443,method:'DELETE',path:'/api/ofs/'+id,headers:hdr,timeout:120000};const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{let j=null;try{j=JSON.parse(b)}catch(e){}res({s:r.statusCode,j:j})})});rq.setTimeout(120000,()=>{try{rq.destroy()}catch(e){}res({ne:'T'})});rq.on('error',e=>res({ne:String(e.message||e)}));rq.end()})}
function GET(url){return new Promise(res=>{const hdr={Accept:'application/json','Cache-Control':'no-cache',Authorization:'Bearer '+T};const o={host:'adm.italyembalagens.com.br',port:443,method:'GET',path:url,headers:hdr,timeout:90000};const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{let j=null;try{j=JSON.parse(b)}catch(e){}res({s:r.statusCode,j:j})})});rq.setTimeout(90000,()=>{try{rq.destroy()}catch(e){}res({ne:'T'})});rq.on('error',e=>res({ne:String(e.message||e)}));rq.end()})}
function mk(n,c,p){return{empresa_id:EU,empId:EU,emp_id:'E1',vendedor_id:VEND,vendId:VEND,cli_id:c,cliId:c,cliente_id:c,numero:n,of:n,produto:p,qtd:1,valor_unitario:10,valor_total:10,data_entrega:'2026-12-31',data_pedido:'2026-08-12',status:'Em aberto',caixa_comprimento:10,caixa_largura:10,itens:[{desc:p,qtd:1,valor_unitario:10}],imgs:[]}}
async function run(name,num,cli,prod,fn){const r=await POST(mk(num,cli,prod));const d=r.j?.data||{};const id=d.id||'';const cid=d.cli_id||d.cliente_id||'';const nom=d.clinome||d.cliente_nome||'';const row={t:name,s:r.s,id:(id||'').slice(0,14),cid:(cid||'').slice(0,14),clinome:nom,modo:d.modo_resolvido||'',err:r.j?.error||null,ref:r.j?.ref||null,qtd:r.j?.qtd||null,ops:(r.j?.candidatos||[]).map(x=>x.nome||'').slice(0,5),del:null,ok:false};try{row.ok=!!fn(row)}catch(e){row.ok=false}if(r.s===200&&id){const dd=await DEL(id);row.del={s:dd.s,ok:!!(dd.s===200||dd.s===204||dd.j?.ok||dd.j?.data?.deleted_at||dd.j?.deleted_at)}}else{row.del={s:null,ok:true}}return row}
(async()=>{
  // sanity: provar que string base64 deu certo
  console.log('STR check:',JSON.stringify({
    a:STR.RIPKE_SEMACENTO_MAIUSC, norm_a:norm(STR.RIPKE_SEMACENTO_MAIUSC),
    b:STR.RIPKE_COM_ACENTO_MAIUSC, norm_b:norm(STR.RIPKE_COM_ACENTO_MAIUSC),
    c:STR.RIPKE_SEMACENTO_MINUSC, norm_c:norm(STR.RIPKE_SEMACENTO_MINUSC)
  }));
  const OUT=[];
  const p0=await GET('/api/ofs/proximo-numero?nc='+Date.now());
  OUT.push({t:'PROX_ANTES',proximo:p0.j?.proximo,maior:p0.j?.maior,s:p0.s,ok:p0.j?.proximo==='2605'});
  OUT.push(await run('BASELINE_UUID','99700',RIPKE_ID,'ZZZ_APAGAR_BASE_B64',x=>x.s===200&&x.cid.slice(0,8)===RIPKE_ID.slice(0,8)&&norm(x.clinome)===norm('MOVEIS RIPKE')));
  await new Promise(r=>setTimeout(r,500));
  OUT.push(await run('EXATO_SEM_ACENTO_MAIUSC','99695',STR.RIPKE_SEMACENTO_MAIUSC,'ZZZ_APAGAR_EXATO_B64',x=>x.s===200&&x.cid.slice(0,8)===RIPKE_ID.slice(0,8)&&norm(x.clinome)===norm('MOVEIS RIPKE')));
  await new Promise(r=>setTimeout(r,500));
  OUT.push(await run('CASO_A_COM_ACENTO','99699',STR.RIPKE_COM_ACENTO_MAIUSC,'ZZZ_APAGAR_CASOA_B64',x=>x.s===200&&x.cid.slice(0,8)===RIPKE_ID.slice(0,8)&&norm(x.clinome)===norm('MOVEIS RIPKE')));
  await new Promise(r=>setTimeout(r,500));
  OUT.push(await run('CASO_B_MINUSC_SEMACENTO','99698',STR.RIPKE_SEMACENTO_MINUSC,'ZZZ_APAGAR_CASOB_B64',x=>x.s===200&&x.cid.slice(0,8)===RIPKE_ID.slice(0,8)&&norm(x.clinome)===norm('MOVEIS RIPKE')));
  await new Promise(r=>setTimeout(r,500));
  OUT.push(await run('CASO_C_INEXISTENTE','99697',STR.INEXISTENTE,'ZZZ_APAGAR_CASOC_B64',x=>x.s===400&&String(x.err||'').length>0&&norm(x.ref||'').includes(norm('xablau 9999'))));
  await new Promise(r=>setTimeout(r,500));
  OUT.push(await run('CASO_D_AMBIGUO','99696',STR.AMBIGUO,'ZZZ_APAGAR_CASOD_B64',x=>{const amb=x.s===400&&x.qtd!=null&&x.qtd>=2&&Array.isArray(x.ops)&&x.ops.length>=2;const uniq=x.s===200&&x.cid.length>0;return amb||uniq}));
  const pN=await GET('/api/ofs/proximo-numero?nc='+Date.now());
  OUT.push({t:'PROX_DEPOIS',proximo:pN.j?.proximo,maior:pN.j?.maior,s:pN.s,ok:pN.j?.proximo==='2605'});
  const todos=OUT.filter(x=>typeof x.ok==='boolean');
  const resumo={passou:todos.filter(x=>x.ok===true).length,total:todos.length,tudo:todos.length>0&&todos.every(x=>x.ok===true)};
  OUT.push({t:'RESUMO',...resumo});
  fs.writeFileSync('_SUITE_B64.json',JSON.stringify(OUT,null,2));
  for(const x of OUT){console.log(JSON.stringify(x))}
  process.exit(resumo.tudo?0:1);
})().catch(e=>{fs.writeFileSync('_SUITE_B64_ERR.txt',String(e?.message||e));process.exit(2);});
