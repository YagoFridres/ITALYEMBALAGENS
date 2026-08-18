const https=require('https');const jwt=require('jsonwebtoken');const fs=require('fs');const path=require('path');const T=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'3h'});
const H='adm.italyembalagens.com.br';
const doReq=(method,path,body,cb)=>{const b=body?JSON.stringify(body):'';const o={host:H,port:443,path,method,headers:{Accept:'application/json','Cache-Control':'no-cache',Authorization:'Bearer '+T},timeout:180000};if(method!=='DELETE'&&body){o.headers['Content-Type']='application/json';o.headers['Content-Length']=Buffer.byteLength(b);}const rq=https.request(o,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{let j=null;try{j=JSON.parse(d)}catch(e){}cb(null,{s:r.statusCode,b:d,j});});});rq.setTimeout(180000,()=>{try{rq.destroy();}catch(_){}cb(new Error('timeout'));});rq.on('error',e=>cb(e));if(method!=='DELETE'&&body)rq.write(b);rq.end();};
const doReqP=(m,p,b)=>new Promise((rs,rj)=>doReq(m,p,b,(e,r)=>e?rj(e):rs(r)));
(async()=>{
  const out={};
  // buscar RIPKE sem filtro + JSON verbose
  out.allCampos=(await doReqP('GET','/api/clientes?search=RIPKE&limit=30&incluir_inativos=true&nocache='+Date.now())).j;
  let arr=Array.isArray(out.allCampos?.data)?out.allCampos.data:(Array.isArray(out.allCampos)?out.allCampos:[]);
  out.arrKeysEach=arr.map(o=>{const K={};for(const k of Object.keys(o||{})){if(['id','nome','rs','razao_social','razao','emp_id','empId','empresa_id','ativo','deleted_at','codigo','cnpj'].includes(k))K[k]=o[k];}return K;});
  // Verificar qual filtro funciona: por 'emp_id' legado (E1/E2) e por 'empresa_id' UUID
  const EMP_UUID='df5f7672-0a6b-402d-ae65-296554236c31';
  // Teste POST com UUID empresa + UUID cliente ID real, nenhum filtro nome
  const realRipke=arr[0]||{};out.realRipkeId=realRipke?.id;out.realRipkeNome=realRipke?.nome||realRipke?.rs;
  // verificar se existe campo 'emp_id' (legado) no RIPKE
  out.ripke_emp_id_legado=realRipke?.emp_id??realRipke?.empId??null;
  out.ripke_empresa_id_uuid=realRipke?.empresa_id??realRipke?.empId??null;
  // A partir do campo legado, fazer filtro correto!
  const VEND='b362b262-0b8f-40e3-865f-7eb5bfe226c8';
  const mkPayload=(num,cli,prod,empExtraLegado,empExtraUuid)=>{const o={vendedor_id:VEND,vendId:VEND,produto:prod,qtd:1,valor_unitario:10,valor_total:10,data_entrega:'2026-12-31',data_pedido:'2026-08-12',status:'Em aberto',itens:[{desc:prod,qtd:1,valor_unitario:10}],imgs:[]};o.numero=num;o.of=num;o.cli_id=cli;o.cliId=cli;o.cliente_id=cli;if(empExtraUuid){o.empresa_id=empExtraUuid;o.empId=empExtraUuid;}if(empExtraLegado){o.emp_id=empExtraLegado;o.empId=empExtraLegado;}return o;};
  // Tentativa 1: UUID CLIENTE + UUID EMPRESA que tinhamos
  out.t1_UuidCliUuidEmp=(await doReqP('POST','/api/ofs',mkPayload('99960',out.realRipkeId||'_noid','ZZZ_TESTE_APAGAR_DIAG_T1',null,EMP_UUID)));
  const d1=out.t1_UuidCliUuidEmp.j?.data||out.t1_UuidCliUuidEmp.j;const id1=d1?.id;out.t1_UuidCliUuidEmp={status:out.t1_UuidCliUuidEmp.s,id:id1?.slice(0,12)||'',cli_id:d1?.cli_id,clinome:d1?.clinome,modo:d1?.modo_resolvido,erro:out.t1_UuidCliUuidEmp.j?.error||null,missing:out.t1_UuidCliUuidEmp.j?.missing||null};
  if(id1)await doReqP('DELETE','/api/ofs/'+id1);
  await new Promise(r=>setTimeout(r,500));
  // Tentativa 2: UUID CLIENTE + emp_id LEGADO (se descobriu)
  if(out.ripke_emp_id_legado){out.t2_UuidCliLegEmp=(await doReqP('POST','/api/ofs',mkPayload('99959',out.realRipkeId||'_noid','ZZZ_TESTE_APAGAR_DIAG_T2',out.ripke_emp_id_legado,null)));const d2=out.t2_UuidCliLegEmp.j?.data||out.t2_UuidCliLegEmp.j;const id2=d2?.id;out.t2_UuidCliLegEmp={status:out.t2_UuidCliLegEmp.s,id:id2?.slice(0,12)||'',cli_id:d2?.cli_id,clinome:d2?.clinome,modo:d2?.modo_resolvido,erro:out.t2_UuidCliLegEmp.j?.error||null};if(id2)await doReqP('DELETE','/api/ofs/'+id2);}
  await new Promise(r=>setTimeout(r,500));
  // Tentativa 3: NOME EXATO BANCO + empresa correta
  const leg=out.ripke_emp_id_legado;const uu=EMP_UUID;const mk3=(num,cli,prod)=>{const o={vendedor_id:VEND,vendId:VEND,produto:prod,qtd:1,valor_unitario:10,valor_total:10,data_entrega:'2026-12-31',data_pedido:'2026-08-12',status:'Em aberto',itens:[{desc:prod,qtd:1,valor_unitario:10}],imgs:[]};o.numero=num;o.of=num;o.cli_id=cli;o.cliId=cli;o.cliente_id=cli;if(uu){o.empresa_id=uu;}if(leg){o.emp_id=leg;}return o;};
  out.t3_NOME_EXATO=(await doReqP('POST','/api/ofs',mk3('99958',out.realRipkeNome||'moveis ripke','ZZZ_TESTE_APAGAR_DIAG_T3_NOME_EXATO')));
  const d3=out.t3_NOME_EXATO.j?.data||out.t3_NOME_EXATO.j;const id3=d3?.id;out.t3_NOME_EXATO={status:out.t3_NOME_EXATO.s,id:id3?.slice(0,12)||'',cli_id:d3?.cli_id,clinome:d3?.clinome,modo:d3?.modo_resolvido,erro:out.t3_NOME_EXATO.j?.error||null,ref:out.t3_NOME_EXATO.j?.ref||null,qtd:out.t3_NOME_EXATO.j?.qtd||null};
  if(id3)await doReqP('DELETE','/api/ofs/'+id3);
  await new Promise(r=>setTimeout(r,500));
  // Tentativa 4: MÓVEIS RIPKE COM ACENTO (caso bug do usuário) + empresa correta
  out.t4_ACENTO=(await doReqP('POST','/api/ofs',mk3('99957','MÓVEIS RIPKE','ZZZ_TESTE_APAGAR_DIAG_T4_ACENTO')));const d4=out.t4_ACENTO.j?.data||out.t4_ACENTO.j;const id4=d4?.id;out.t4_ACENTO={status:out.t4_ACENTO.s,id:id4?.slice(0,12)||'',cli_id:d4?.cli_id,clinome:d4?.clinome,modo:d4?.modo_resolvido,erro:out.t4_ACENTO.j?.error||null,ref:out.t4_ACENTO.j?.ref||null,qtd:out.t4_ACENTO.j?.qtd||null};if(id4)await doReqP('DELETE','/api/ofs/'+id4);
  try{fs.writeFileSync(path.join(__dirname,'_DIAG4.json'),JSON.stringify(out,null,2));}catch(e){}
  console.log(JSON.stringify({arrKeysEach:out.arrKeysEach,t1:out.t1_UuidCliUuidEmp,t2:out.t2_UuidCliLegEmp,t3:out.t3_NOME_EXATO,t4:out.t4_ACENTO},null,2));
  process.exit(0);
})().catch(e=>{console.error('FATAL',e?.message||e);process.exit(2);});
