const https=require('https');const jwt=require('jsonwebtoken');const fs=require('fs');const T=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'8h'});const EU='df5f7672-0a6b-402d-ae65-296554236c31';const VEND='b362b262-0b8f-40e3-865f-7eb5bfe226c8';const RIPKE='be617df1-441a-4f11-918e-d813a5ac854c';
function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim()}
function POST(body){return new Promise(res=>{const bdy=JSON.stringify(body);const hdr={Accept:'application/json','Cache-Control':'no-cache',Authorization:'Bearer '+T,'Content-Type':'application/json','Content-Length':Buffer.byteLength(bdy)};const o={host:'adm.italyembalagens.com.br',port:443,method:'POST',path:'/api/ofs',headers:hdr,timeout:180000};const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{let j=null;try{j=JSON.parse(b)}catch(e){}res({s:r.statusCode,j:j,b:b})})});rq.setTimeout(180000,()=>{try{rq.destroy()}catch(e){}res({ne:'T'})});rq.on('error',e=>res({ne:String(e.message||e)}));rq.write(bdy);rq.end()})}
function DEL(id){return new Promise(res=>{const hdr={Accept:'application/json','Cache-Control':'no-cache',Authorization:'Bearer '+T};const o={host:'adm.italyembalagens.com.br',port:443,method:'DELETE',path:'/api/ofs/'+id,headers:hdr,timeout:90000};const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{let j=null;try{j=JSON.parse(b)}catch(e){}res({s:r.statusCode,j:j})})});rq.setTimeout(90000,()=>{try{rq.destroy()}catch(e){}res({ne:'T'})});rq.on('error',e=>res({ne:String(e.message||e)}));rq.end()})}
(async()=>{
  const CLI='MÓVEIS RIPKE'; // com acento - exatamente caso A usuário
  console.log('TESTE:',CLI,'norm=',norm(CLI));
  const body={empresa_id:EU,empId:EU,emp_id:'E1',vendedor_id:VEND,vendId:VEND,cli_id:CLI,cliId:CLI,cliente_id:CLI,numero:'99699',of:'99699',produto:'ZZZ_TESTE_APAGAR_ACENTO_NODE',qtd:1,valor_unitario:10,valor_total:10,data_entrega:'2026-12-31',data_pedido:'2026-08-12',status:'Em aberto',caixa_comprimento:10,caixa_largura:10,itens:[{desc:'ZZZ_TESTE_APAGAR_ACENTO_NODE',qtd:1,valor_unitario:10}],imgs:[]};
  const r=await POST(body);
  const d=r.j?.data||{};const id=d.id;const cid=d.cli_id||d.cliente_id||'';const nom=d.clinome||d.cliente_nome||'';const ok=r.s===200 && cid.slice(0,8)===RIPKE.slice(0,8) && norm(nom)===norm('MOVEIS RIPKE');
  let del=null;if(r.s===200&&id){const dd=await DEL(id);del={s:dd.s,ok:!!(dd.s===200||dd.s===204||dd.j?.ok||dd.j?.data?.deleted_at||dd.j?.deleted_at)}}
  const out={http:r.s,ok,id:(id||'').slice(0,14),cid:(cid||'').slice(0,14),nome:nom,modo:d.modo_resolvido||'',err:r.j?.error||null,ref:r.j?.ref||null,qtd:r.j?.qtd||null,ops:(r.j?.candidatos||[]).map(x=>x.nome).slice(0,5),del};
  fs.writeFileSync('_T_ACENTO.json',JSON.stringify(out,null,2));
  console.log(JSON.stringify(out,null,2));
  process.exit(ok?0:1);
})().catch(e=>{fs.writeFileSync('_T_ACENTO_ERR.txt',String(e.message||e));process.exit(2);});
