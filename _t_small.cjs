const https=require('https');const jwt=require('jsonwebtoken');const T=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'3h'});process.stdout.write('starting...\n');
const H='adm.italyembalagens.com.br';
const doReq=(method,path,body,cb)=>{const b=body?JSON.stringify(body):'';const o={host:H,port:443,path,method,headers:{Accept:'application/json','Cache-Control':'no-cache',Authorization:'Bearer '+T},timeout:120000};if(method!=='DELETE'&&body){o.headers['Content-Type']='application/json';o.headers['Content-Length']=Buffer.byteLength(b);}const rq=https.request(o,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{let j=null;try{j=JSON.parse(d)}catch(e){}cb(null,{s:r.statusCode,b:d,j});});});rq.setTimeout(120000,()=>{try{rq.destroy();}catch(_){}cb(new Error('timeout'));});rq.on('error',e=>cb(e));if(method!=='DELETE'&&body)rq.write(b);rq.end();};
const doReqP=(m,p,b)=>new Promise((rs,rj)=>doReq(m,p,b,(e,r)=>e?rj(e):rs(r)));
const RIPKE_FULL_ID='be617df1-9c19-4f19-a1a7-66e03d65c0c7';const VEND='b362b262-0b8f-40e3-865f-7eb5bfe226c8';
(async()=>{
  console.log('1) search=RIPKE /api/clientes');
  const r1=await doReqP('GET','/api/clientes?search=RIPKE&limit=50&nocache='+Date.now());
  console.log('HTTP',r1.s);let ar=r1.j?.data||r1.j;console.log('len',Array.isArray(ar)?ar.length:'non-arr');
  if(Array.isArray(ar)&&ar.length)ar.slice(0,10).forEach(o=>console.log('- id',o.id?.slice(0,16),'nome',JSON.stringify(o.nome||o.rs||o.razao_social),'emp',o.empresa_id||o.emp_id||o.empId,'del',!!o.deleted_at,'cod',o.codigo||''));
  else console.log('body peek',String(r1.b||'').slice(0,500));
  console.log('\n2) POST cli_id=RIPKE_UUID (sem empresa para testar)');
  const payloadVazio={cli_id:RIPKE_FULL_ID,cliId:RIPKE_FULL_ID,cliente_id:RIPKE_FULL_ID,vendedor_id:VEND,vendId:VEND,produto:'ZZZ_TESTE_APAGAR_RIPKE_UUID',qtd:1,valor_unitario:10,valor_total:10,data_entrega:'2026-12-31',data_pedido:'2026-08-12',status:'Em aberto',itens:[{desc:'ZZZ_TESTE_APAGAR_RIPKE_UUID',qtd:1,valor_unitario:10}],imgs:[]};
  const r2=await doReqP('POST','/api/ofs',{...payloadVazio,numero:'99950',of:'99950'});
  console.log('HTTP',r2.s);const d2=r2.j?.data||r2.j;const id2=d2?.id;console.log('cli_id resolvido',d2?.cli_id||d2?.cliente_id,'clinome',d2?.clinome||d2?.cliente_nome,'modo',d2?.modo_resolvido,'erro',r2.j?.error||null,'id',id2?'criado '+id2.slice(0,12):'nao criado');
  if(r2.s===200&&id2){const rd=await doReqP('DELETE','/api/ofs/'+id2);console.log('soft-del status',rd.s);}
  console.log('\n3) POST nome MÓVEIS RIPKE sem empresa (vazio)');
  const r3=await doReqP('POST','/api/ofs',{...payloadVazio,cli_id:'MÓVEIS RIPKE',cliId:'MÓVEIS RIPKE',cliente_id:'MÓVEIS RIPKE',numero:'99949',of:'99949',produto:'ZZZ_TESTE_APAGAR_RIPKE_NOME',itens:[{desc:'ZZZ_TESTE_APAGAR_RIPKE_NOME',qtd:1,valor_unitario:10}]});
  console.log('HTTP',r3.s,'erro',r3.j?.error||null,'qtd',r3.j?.qtd||0,'ref',r3.j?.ref||null,'id',(r3.j?.data?.id||r3.j?.id||'').slice(0,12)||null);
  const id3=r3.j?.data?.id||r3.j?.id;if(r3.s===200&&id3){const rd=await doReqP('DELETE','/api/ofs/'+id3);console.log('soft-del status',rd.s);}
  process.exit(0);
})().catch(e=>{console.error('FATAL',e.message);process.exit(2);});
