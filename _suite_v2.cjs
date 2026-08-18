const https=require('https');const jwt=require('jsonwebtoken');const fs=require('fs');const path=require('path');const T=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'6h'});
const GET=(u,tm)=>new Promise(R=>{const t0=Date.now();const hdr={Accept:'application/json','Cache-Control':'no-cache',Authorization:'Bearer '+T};const o={host:'adm.italyembalagens.com.br',port:443,path:u,method:'GET',headers:hdr,timeout:tm||90000};const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{let j;try{j=JSON.parse(b)}catch(e){}R({ms:Date.now()-t0,s:r.statusCode,j,b});});});rq.setTimeout(tm||90000,()=>{try{rq.destroy();}catch(_){}R({ne:'T'});});rq.on('error',e=>R({ne:String(e?.message||e)}));rq.end();});
const PRE=(u,body,tm,mtd)=>new Promise(R=>{const bdy=(mtd!=='DELETE'&&body)?JSON.stringify(body):'';const t0=Date.now();const hdr={Accept:'application/json','Cache-Control':'no-cache',Authorization:'Bearer '+T};if(mtd!=='DELETE'){hdr['Content-Type']='application/json';hdr['Content-Length']=Buffer.byteLength(bdy);}const o={host:'adm.italyembalagens.com.br',port:443,path:u,method:mtd||'POST',headers:hdr,timeout:tm||180000};const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{let j;try{j=JSON.parse(b)}catch(e){}R({ms:Date.now()-t0,s:r.statusCode,j,b});});});rq.setTimeout(tm||180000,()=>{try{rq.destroy();}catch(_){}R({ne:'T'});});rq.on('error',e=>R({ne:String(e?.message||e)}));if(mtd!=='DELETE'&&body)rq.write(bdy);rq.end();});
const P=(u,b,tm)=>PRE(u,b,tm,'POST');const DEL=(u,tm)=>PRE(u,null,tm,'DELETE');
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const EMP_UUID='df5f7672-0a6b-402d-ae65-296554236c31';const EMP_LEG='E1';const RIPKE_UID='be617df1-441a-4f11-918e-d813a5ac854c';const VEND='b362b262-0b8f-40e3-865f-7eb5bfe226c8';
const mk=(n,c,p)=>{const o={empresa_id:EMP_UUID,empId:EMP_UUID,emp_id:EMP_LEG,vendedor_id:VEND,vendId:VEND,produto:p,qtd:1,valor_unitario:10,valor_total:10,data_entrega:'2026-12-31',data_pedido:'2026-08-12',status:'Em aberto',caixa_comprimento:10,caixa_largura:10,itens:[{desc:p,qtd:1,valor_unitario:10}],imgs:[]};o.numero=n;o.of=n;o.cli_id=c;o.cliId=c;o.cliente_id=c;return o;};
const out={};out.st=Date.now();out.deploy=[];
(async()=>{
  for(let i=1;i<=22;i++){
    const r=await GET('/api/version?nc='+Date.now()+'_'+i,12000);
    const pv=String(r?.j?.runtime?.patch||'').trim();const cm=String(r?.j?.git?.commit||'').slice(0,7);
    out.deploy.push({i,s:r.s,pv,cm});if(pv==='20260812110000'||cm==='ca7a301'){out.deployOk=1;break;}
    await new Promise(r=>setTimeout(r,2000));
  }
  out.prox_num=(await GET('/api/ofs/proximo-numero?nc='+Date.now(),60000)).j;
  const run=async(t,n,c,p,fn)=>{const r=await P('/api/ofs',mk(n,c,p),90000);const d=r.j?.data||r.j;const id=d?.id;const row={t,s:r.s,id:(id||'').slice(0,14),cid:(d?.cli_id||d?.cliente_id||'').slice(0,12),clinome:d?.clinome||d?.cliente_nome||'',modo:d?.modo_resolvido||'',err:r.j?.error||null,ref:r.j?.ref||null,qtd:r.j?.qtd||null,ops:(r.j?.candidatos||[]).map(x=>x?.nome||'').slice(0,5),del:null,ok:false};try{row.ok=!!fn(row);}catch(_){}if(r.s===200&&id){const dd=await DEL('/api/ofs/'+id,60000);row.del={s:dd.s,ok:dd.s===200||dd.s===204||dd.j?.ok||dd.j?.data?.deleted_at||dd.j?.deleted_at||false};}else{row.del={ok:true,s:null};}return row;};
  const wait=(ms)=>new Promise(r=>setTimeout(r,ms));
  out.cases=[];
  out.cases.push(await run('Baseline_UUID','99700',RIPKE_UID,'ZZZ_TESTE_APAGAR_BASE_UUID',x=>x.s===200&&x.cid.slice(0,8)===RIPKE_UID.slice(0,8)&&norm(x.clinome)===norm('MOVEIS RIPKE')));await wait(400);
  out.cases.push(await run('CasoA_ACENTO','99699','MÓVEIS RIPKE','ZZZ_TESTE_APAGAR_CASOA_ACENTO',x=>x.s===200&&x.cid.slice(0,8)===RIPKE_UID.slice(0,8)&&norm(x.clinome)===norm('MOVEIS RIPKE')));await wait(400);
  out.cases.push(await run('CasoB_SEM_ACENTO_MINUSC','99698','moveis ripke','ZZZ_TESTE_APAGAR_CASOB_SEMACENTO',x=>x.s===200&&x.cid.slice(0,8)===RIPKE_UID.slice(0,8)&&norm(x.clinome)===norm('MOVEIS RIPKE')));await wait(400);
  out.cases.push(await run('CasoC_INEXISTENTE','99697','cliente xablau 8888 inexistente','ZZZ_TESTE_APAGAR_CASOC_INEXIST',x=>x.s===400&&!!x.err&&norm(x.ref||'').includes('xablau 8888 inexistente')));await wait(400);
  out.cases.push(await run('CasoD_AMBIGUO','99696','moveis','ZZZ_TESTE_APAGAR_CASOD_AMBIGUO',x=>{const amb=x.s===400&&x.qtd!=null&&x.qtd>=2&&x.ops.length>=2;const unico=x.s===200&&x.cid.length>0;return amb||unico;}));
  out.prox_num_pos=(await GET('/api/ofs/proximo-numero?nc='+Date.now(),60000)).j;
  out.res={passou:out.cases.filter(x=>x.ok).length,total:out.cases.length,todo:out.cases.every(x=>x.ok===true)};
  out.elapsed=((Date.now()-out.st)/1000).toFixed(1)+'s';
  try{fs.writeFileSync(path.join(__dirname,'_SUITE_V2_FINAL.json'),JSON.stringify(out,null,2));}catch(e){try{fs.writeFileSync(path.join(__dirname,'_SUITE_ERR.txt'),String(e.message||e));}catch(_){}}
  console.log(JSON.stringify({deployOk:out.deployOk,ultDeploy:out.deploy[out.deploy.length-1]||null,prox:out.prox_num,casos:out.cases.map(c=>({t:c.t,s:c.s,ok:c.ok,err:c.err?.slice(0,80)||null,id:c.id,modo:c.modo,qtd:c.qtd})),resumo:out.res,prox_pos:out.prox_num_pos,tempo:out.elapsed},null,2));
  process.exit(0);
})().catch(e=>{try{fs.writeFileSync(path.join(__dirname,'_SUITE_CATCH.txt'),String(e?.message||e));}catch(_){}console.error('FATAL',e.message);process.exit(2);});
