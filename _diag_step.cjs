const https=require('https');const jwt=require('jsonwebtoken');const fs=require('fs');const path=require('path');const T=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'3h'});
const H='adm.italyembalagens.com.br';
const doReq=(method,path,body,cb)=>{const b=body?JSON.stringify(body):'';const o={host:H,port:443,path,method,headers:{Accept:'application/json','Cache-Control':'no-cache',Authorization:'Bearer '+T},timeout:180000};if(method!=='DELETE'&&body){o.headers['Content-Type']='application/json';o.headers['Content-Length']=Buffer.byteLength(b);}const rq=https.request(o,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{let j=null;try{j=JSON.parse(d)}catch(e){}cb(null,{s:r.statusCode,b:d,j});});});rq.setTimeout(180000,()=>{try{rq.destroy();}catch(_){}cb(new Error('timeout'));});rq.on('error',e=>cb(e));if(method!=='DELETE'&&body)rq.write(b);rq.end();};
const doReqP=(m,p,b)=>new Promise((rs,rj)=>doReq(m,p,b,(e,r)=>e?rj(e):rs(r)));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const EMP_RIPKE='df5f7672-0a6b-402d-ae65-296554236c31';const VEND='b362b262-0b8f-40e3-865f-7eb5bfe226c8';
(async()=>{
  const out={};
  // STEP1: dump TODOS campos cliente RIPKE (incluir_inativos=true, empId da empresa)
  out.searchRipkeEmp=(await doReqP('GET','/api/clientes?search=RIPKE&incluir_inativos=true&empId='+EMP_RIPKE+'&nocache='+Date.now())).j;
  let arr;
  if(Array.isArray(out.searchRipkeEmp?.data))arr=out.searchRipkeEmp.data;else if(Array.isArray(out.searchRipkeEmp))arr=out.searchRipkeEmp;else arr=[];
  out.ripkeObjFull=arr.length?arr[0]:null;
  out.ripkeId=out.ripkeObjFull?.id;
  // STEP2: POST com UUID do cliente, empresa correta (baseline: isso TEM que funcionar)
  const mk=(num,cli,prod,extra={})=>{const o={empresa_id:EMP_RIPKE,empId:EMP_RIPKE,vendedor_id:VEND,vendId:VEND,produto:prod,qtd:1,valor_unitario:10,valor_total:10,data_entrega:'2026-12-31',data_pedido:'2026-08-12',status:'Em aberto',caixa_comprimento:10,caixa_largura:10,itens:[{desc:prod,qtd:1,valor_unitario:10}],imgs:[]};o.numero=num;o.of=num;o.cli_id=cli;o.cliId=cli;o.cliente_id=cli;Object.assign(o,extra||{});return o;};
  out.step2_UUID=(await doReqP('POST','/api/ofs',mk('99975',out.ripkeId||'be617df1-0000-0000-0000-000000000000','ZZZ_TESTE_APAGAR_STEP2_UUID',{})));
  const data2=out.step2_UUID.j?.data||out.step2_UUID.j;const id2=data2?.id;out.step2_UUID={status:out.step2_UUID.s,id:id2?.slice(0,14),cli_id:data2?.cli_id,clinome:data2?.clinome,modo:data2?.modo_resolvido,erro:out.step2_UUID.j?.error||null};
  if(id2){const dd=await doReqP('DELETE','/api/ofs/'+id2);out.step2_DEL={status:dd.s,ok:dd.j?.ok||dd.j?.data?.deleted_at||(dd.s===200||dd.s===204)};}
  // STEP3: POST com NOME EXATO do banco (string exata do campo nome)
  const nomeExato=out.ripkeObjFull?.nome||out.ripkeObjFull?.rs||out.ripkeObjFull?.razao_social||'';
  out.step3_NOME_EXATO=(await doReqP('POST','/api/ofs',mk('99974',nomeExato,'ZZZ_TESTE_APAGAR_STEP3_NOME_EXATO',{})));
  const data3=out.step3_NOME_EXATO.j?.data||out.step3_NOME_EXATO.j;const id3=data3?.id;out.step3_NOME_EXATO={status:out.step3_NOME_EXATO.s,id:id3?.slice(0,14),cli_id:data3?.cli_id,clinome:data3?.clinome,modo:data3?.modo_resolvido,erro:out.step3_NOME_EXATO.j?.error||null,ref:out.step3_NOME_EXATO.j?.ref||null,qtd:out.step3_NOME_EXATO.j?.qtd||null,nomeEnviado:nomeExato};
  if(id3){const dd=await doReqP('DELETE','/api/ofs/'+id3);out.step3_DEL={status:dd.s,ok:dd.j?.ok||dd.j?.data?.deleted_at||(dd.s===200||dd.s===204)};}
  // STEP4: POST com nome exato MINUSCULO (normalizado)
  out.step4_MIN=(await doReqP('POST','/api/ofs',mk('99973',nomeExato.toLowerCase(),'ZZZ_TESTE_APAGAR_STEP4_MIN',{})));
  const data4=out.step4_MIN.j?.data||out.step4_MIN.j;const id4=data4?.id;out.step4_MIN={status:out.step4_MIN.s,id:id4?.slice(0,14),cli_id:data4?.cli_id,clinome:data4?.clinome,modo:data4?.modo_resolvido,erro:out.step4_MIN.j?.error||null,ref:out.step4_MIN.j?.ref||null,nomeEnviado:nomeExato.toLowerCase()};
  if(id4){const dd=await doReqP('DELETE','/api/ofs/'+id4);out.step4_DEL={status:dd.s,ok:dd.j?.ok||dd.j?.data?.deleted_at||(dd.s===200||dd.s===204)};}
  try{fs.writeFileSync(path.join(__dirname,'_DIAG_STEP.json'),JSON.stringify(out,null,2));}catch(e){}
  console.log(JSON.stringify(out,null,2));
  process.exit(0);
})().catch(e=>{console.error('FATAL',e?.message||e);process.exit(2);});
