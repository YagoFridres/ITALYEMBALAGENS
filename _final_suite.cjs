const https=require('https');const jwt=require('jsonwebtoken');const fs=require('fs');
const B64=(b)=>Buffer.from(b,'base64').toString('utf8');
const CASES={
  EXATO_BANCO:   B64('TU9WRUlTIFJJUEtF'),
  CASOA_ACENTO:  B64('TcOTVkVJUyBSSVBLRQ=='),
  CASOB_MINUSC:  B64('bW92ZWlzIHJpcGtl'),
  CASOC_INEXIST: B64('Y2xpZW50ZSB4YWJsYXUgOTk5OQ=='),
  CASOD_AMBIGUO: B64('bW92ZWlz'),
};
const T=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'12h'});
const EU='df5f7672-0a6b-402d-ae65-296554236c31';const VEND='b362b262-0b8f-40e3-865f-7eb5bfe226c8';const RIPKE_ID='be617df1-441a-4f11-918e-d813a5ac854c';
function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim()}
function REQ(op){return new Promise(res=>{const hdr={Accept:'application/json','Cache-Control':'no-cache',Authorization:'Bearer '+T};if(op.body){hdr['Content-Type']='application/json';hdr['Content-Length']=Buffer.byteLength(op.body)}const o={host:'adm.italyembalagens.com.br',port:443,method:op.method||'GET',path:op.path,headers:hdr,timeout:op.timeout||120000};const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{let j=null;try{j=JSON.parse(b)}catch(_){}res({s:r.statusCode,j,b:b.slice(0,3000)})})});rq.setTimeout(op.timeout||120000,()=>{try{rq.destroy()}catch(_){}res({ne:'T'})});rq.on('error',e=>res({ne:String(e?.message||e)}));if(op.body)rq.write(op.body);rq.end()})}
const GET=p=>REQ({method:'GET',path:p,timeout:90000});
const POST=p=>REQ({method:'POST',path:'/api/ofs',body:JSON.stringify(p),timeout:240000});
const DELID=id=>REQ({method:'DELETE',path:'/api/ofs/'+id,timeout:90000});
function mk(n,c,p){return{empresa_id:EU,empId:EU,emp_id:'E1',vendedor_id:VEND,vendId:VEND,cli_id:c,cliId:c,cliente_id:c,numero:n,of:n,produto:p,qtd:1,valor_unitario:10,valor_total:10,data_entrega:'2026-12-31',data_pedido:'2026-08-12',status:'Em aberto',caixa_comprimento:10,caixa_largura:10,itens:[{desc:p,qtd:1,valor_unitario:10}],imgs:[]}}
async function run(name,num,cli,prod,fn){const r=await POST(mk(num,cli,prod));const d=r.j?.data||{};const id=d.id||'';const cid=d.cli_id||d.cliente_id||'';const nom=d.clinome||d.cliente_nome||'';const row={t:name,s:r.s,cli_in:cli,id:(id||'').slice(0,14),cid:(cid||'').slice(0,14),clinome:nom,modo:d.modo_resolvido||'',err:r.j?.error||null,ref:r.j?.ref||null,qtd:r.j?.qtd||null,ops:(r.j?.candidatos||[]).map(x=>x.nome||'').slice(0,5),del:null,ok:false};try{row.ok=!!fn(row)}catch(_){row.ok=false}if(r.s===200&&id){const dd=await DELID(id);row.del={s:dd.s,ok:!!(dd.s===200||dd.s===204||dd.j?.ok||dd.j?.data?.deleted_at||dd.j?.deleted_at)}}else{row.del={s:null,ok:true}}return row}
(async()=>{
  const OUT=[];let deployed=false;
  for(let i=1;i<=24;i++){
    const v=await GET('/api/version?nc='+Date.now()+'_'+i);
    const pv=String(v.j?.runtime?.patch||'').trim();
    const cm=String(v.j?.git?.commit||'').slice(0,7);
    OUT.push({t:'POLL_DEPLOY',i,s:v.s,pv,cm,deploy:pv==='20260812120000'||cm==='3049359'});
    if(pv==='20260812120000'||cm==='3049359'){deployed=true;break}
    await new Promise(r=>setTimeout(r,5000));
  }
  const p0=await GET('/api/ofs/proximo-numero?nc='+Date.now());OUT.push({t:'PROX_ANTES',s:p0.s,proximo:p0.j?.proximo,maior:p0.j?.maior,ok:p0.j?.proximo==='2605'});
  if(!deployed){OUT.push({t:'FATAL',ok:false,msg:'deploy nao chegou em 2min'});try{fs.writeFileSync('_FINAL_SUITE.json',JSON.stringify(OUT,null,2))}catch(_){}process.exit(3)}
  await new Promise(r=>setTimeout(r,500));
  OUT.push(await run('BASELINE_UUID','99700',RIPKE_ID,'ZZZ_APAGAR_BASELINE_UUID_V3',x=>x.s===200&&x.cid.slice(0,8)===RIPKE_ID.slice(0,8)&&norm(x.clinome)===norm('MOVEIS RIPKE')));
  await new Promise(r=>setTimeout(r,500));
  OUT.push(await run('EXATO_BANCO_SEMACENTO','99695',CASES.EXATO_BANCO,'ZZZ_APAGAR_EXATO_BANCO_V3',x=>x.s===200&&x.cid.slice(0,8)===RIPKE_ID.slice(0,8)&&norm(x.clinome)===norm('MOVEIS RIPKE')));
  await new Promise(r=>setTimeout(r,500));
  OUT.push(await run('CASOA_COM_ACENTO_MAIUSC','99699',CASES.CASOA_ACENTO,'ZZZ_APAGAR_CASOA_ACENTO_V3',x=>x.s===200&&x.cid.slice(0,8)===RIPKE_ID.slice(0,8)&&norm(x.clinome)===norm('MOVEIS RIPKE')));
  await new Promise(r=>setTimeout(r,500));
  OUT.push(await run('CASOB_SEMACENTO_MINUSC','99698',CASES.CASOB_MINUSC,'ZZZ_APAGAR_CASOB_MINUS_V3',x=>x.s===200&&x.cid.slice(0,8)===RIPKE_ID.slice(0,8)&&norm(x.clinome)===norm('MOVEIS RIPKE')));
  await new Promise(r=>setTimeout(r,500));
  OUT.push(await run('CASOC_INEXISTENTE','99697',CASES.CASOC_INEXIST,'ZZZ_APAGAR_CASOC_INEXIST_V3',x=>x.s===400&&String(x.err||'').length>0&&norm(x.ref||'').includes(norm('xablau 9999'))));
  await new Promise(r=>setTimeout(r,500));
  OUT.push(await run('CASOD_AMBIGUO','99696',CASES.CASOD_AMBIGUO,'ZZZ_APAGAR_CASOD_AMBIGUO_V3',x=>{const amb=x.s===400&&x.qtd!=null&&x.qtd>=2&&Array.isArray(x.ops)&&x.ops.length>=2;const uniq=x.s===200&&x.cid.length>0;return amb||uniq}));
  const pN=await GET('/api/ofs/proximo-numero?nc='+Date.now());OUT.push({t:'PROX_DEPOIS',s:pN.s,proximo:pN.j?.proximo,maior:pN.j?.maior,ok:pN.j?.proximo==='2605'});
  const tudoBool=OUT.filter(x=>typeof x.ok==='boolean');
  const resumo={passou:tudoBool.filter(x=>x.ok===true).length,total:tudoBool.length,tudo:tudoBool.length>0&&tudoBool.every(x=>x.ok===true)};
  OUT.push({t:'RESUMO_FINAL',...resumo});
  try{fs.writeFileSync('_FINAL_SUITE.json',JSON.stringify(OUT,null,2))}catch(e){try{fs.writeFileSync('_FINAL_SUITE_ERR.txt',String(e?.message||e))}catch(_){}}
  for(const x of OUT){const l=JSON.stringify(x);console.log(l.length<600?l:l.slice(0,600))}
  process.exit(resumo.tudo?0:1);
})().catch(e=>{try{fs.writeFileSync('_FINAL_SUITE_CATCH.txt',String(e?.message||e))}catch(_){}console.error('CATCH',e?.message||e);process.exit(2);});
