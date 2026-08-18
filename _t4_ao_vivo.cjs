const https=require('https');const jwt=require('jsonwebtoken');const path=require('path');const fs=require('fs');const T=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'3h'});
const PRE=(u,body,tm,mtd)=>new Promise(R=>{const bdy=(mtd&&mtd!=='DELETE')?JSON.stringify(body||{}):'';const t0=Date.now();const hdr={Accept:'application/json','Cache-Control':'no-cache',Authorization:'Bearer '+T};if(mtd!=='DELETE'){hdr['Content-Type']='application/json';hdr['Content-Length']=Buffer.byteLength(bdy);}const o={host:'adm.italyembalagens.com.br',port:443,path:u,method:mtd||'POST',headers:hdr,timeout:tm||60000};const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{let j;try{j=JSON.parse(b)}catch(e){j={pe:e.message,r:b.slice(0,2000)}};R({ms:Date.now()-t0,s:r.statusCode,j});});});rq.setTimeout(tm||60000,()=>{try{rq.destroy();}catch(_){}R({ne:'TIMEOUT'});});rq.on('error',e=>R({ne:String(e?.message||e)}));if(mtd!=='DELETE'&&bdy)rq.write(bdy);rq.end();});
const P=(u,body,tm)=>PRE(u,body,tm,'POST');const DEL=(u,tm)=>PRE(u,null,tm,'DELETE');const GET=(u,tm)=>PRE(u,null,tm,'GET');
const baseBase={vendedor_id:'b362b262-0b8f-40e3-865f-7eb5bfe226c8',vendId:'b362b262-0b8f-40e3-865f-7eb5bfe226c8',produto:'ZZZ_TESTE_APAGAR_P6_OFRAPIDA',qtd:1,valor_unitario:10,valor_total:10,data_entrega:'2026-12-31',data_pedido:'2026-08-12',status:'Em aberto',emp_id:'E1',empId:'E1',caixa_comprimento:10,caixa_largura:10,cores_impressao:[],itens:[{desc:'ZZZ_TESTE_APAGAR_P6_OFRAPIDA',qtd:1,valor_unitario:10}],imgs:[]};
(async()=>{
  const RIPKE_UUID='be617df1';const res={feito_em:new Date().toISOString(),casos:{},deletes:{}};
  // CASO A: nome com ACENTO
  { const num='99960';const cli='MÓVEIS RIPKE';const r=await P('/api/ofs',{...baseBase,numero:num,of:num,cli_id:cli,cliId:cli,cliente_id:cli},60000);
    const data=r.j?.data||r.j;const id=data?.id||'';const cli_id=(data?.cli_id||data?.cliente_id||'').slice(0,8);const clinome=data?.clinome||data?.cliente_nome||'';const modo=data?.modo_resolvido||null;
    res.casos.A_com_acento={status:r.s,ms:r.ms,id:id?.slice(0,8)||'',cli_id,clinome,modo,ok:(r.s===200 && cli_id===RIPKE_UUID),erro:r.j?.error||null,ref:r.j?.ref||null,qtd:r.j?.qtd||null,opcoes:(r.j?.candidatos||[]).map(x=>x?.nome||'').slice(0,5)};
    if(r.s===200&&id){res.deletes.A={id};const d=await DEL('/api/ofs/'+id,60000);res.deletes.A.status=d.s;res.deletes.A.erro=d.j?.error||null;} }
  await new Promise(rr=>setTimeout(rr,500));
  // CASO B: nome SEM ACENTO
  { const num='99959';const cli='moveis ripke';const r=await P('/api/ofs',{...baseBase,numero:num,of:num,cli_id:cli,cliId:cli,cliente_id:cli},60000);
    const data=r.j?.data||r.j;const id=data?.id||'';const cli_id=(data?.cli_id||data?.cliente_id||'').slice(0,8);const clinome=data?.clinome||data?.cliente_nome||'';const modo=data?.modo_resolvido||null;
    res.casos.B_sem_acento_normaliza={status:r.s,ms:r.ms,id:id?.slice(0,8)||'',cli_id,clinome,modo,ok:(r.s===200&&cli_id===RIPKE_UUID),erro:r.j?.error||null,ref:r.j?.ref||null,qtd:r.j?.qtd||null,opcoes:(r.j?.candidatos||[]).map(x=>x?.nome||'').slice(0,5)};
    if(r.s===200&&id){res.deletes.B={id};const d=await DEL('/api/ofs/'+id,60000);res.deletes.B.status=d.s;res.deletes.B.erro=d.j?.error||null;} }
  await new Promise(rr=>setTimeout(rr,500));
  // CASO C: INEXISTENTE
  { const num='99958';const cli='moveis ripke xablau inexistente 888123';const r=await P('/api/ofs',{...baseBase,numero:num,of:num,cli_id:cli,cliId:cli,cliente_id:cli},60000);
    const data=r.j?.data||r.j;const id=data?.id||'';res.casos.C_inexistente={status:r.s,ms:r.ms,id:id?.slice(0,8)||'',erro:r.j?.error||null,ref:r.j?.ref||null,missing:r.j?.missing||null,ok:(r.s===400 && !!r.j?.error && !!r.j?.ref && String(r.j?.ref).includes('xablau'))};
    if(r.s===200&&id){res.deletes.C={id};const d=await DEL('/api/ofs/'+id,60000);res.deletes.C.status=d.s;res.deletes.C.erro=d.j?.error||null;} }
  await new Promise(rr=>setTimeout(rr,500));
  // CASO D: PARCIAL AMBIGUIDADE (RIPKE)
  { const num='99957';const cli='RIPKE';const r=await P('/api/ofs',{...baseBase,numero:num,of:num,cli_id:cli,cliId:cli,cliente_id:cli},60000);
    const data=r.j?.data||r.j;const id=data?.id||'';const cli_id=(data?.cli_id||data?.cliente_id||'').slice(0,8);const clinome=data?.clinome||data?.cliente_nome||'';
    const foiBloqueado=(r.s===400 && r.j?.qtd != null && r.j?.qtd>1) || (r.s===400 && (r.j?.error||'').toLowerCase().includes('amb'));
    res.casos.D_ambiguidade={status:r.s,ms:r.ms,id:id?.slice(0,8)||'',cli_id,clinome,qtd:r.j?.qtd||0,erro:r.j?.error||null,ref:r.j?.ref||null,opcoes:(r.j?.candidatos||[]).map(x=>x?.nome||'').slice(0,6),ok:foiBloqueado};
    if(r.s===200&&id){res.deletes.D={id};const d=await DEL('/api/ofs/'+id,60000);res.deletes.D.status=d.s;res.deletes.D.erro=d.j?.error||null;} }
  // BÔNUS: reler /api/ofs/proximo-numero depois de tudo (garantir que 2605 permanece)
  res.pos_prox_num=(await GET('/api/ofs/proximo-numero?nc='+Date.now(),60000)).j;
  res.geral_passou=Object.values(res.casos).every(x=>x.ok===true);
  try{fs.writeFileSync(path.join(__dirname,'_TESTES_4_CENARIOS_OF_RAPIDA.json'),JSON.stringify(res,null,2));}catch(e){try{fs.writeFileSync(path.join(__dirname,'_TESTES_ERR.txt'),String(e?.message||e));}catch(_){}}
  console.log(JSON.stringify(res,null,2));
  process.exit(0);
})().catch(e=>{console.error('CATCH',e?.message||e);process.exit(2);});
