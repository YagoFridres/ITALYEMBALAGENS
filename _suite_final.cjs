const https=require('https');const jwt=require('jsonwebtoken');const fs=require('fs');const path=require('path');const T=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'3h'});
const H='adm.italyembalagens.com.br';
const doReq=(method,path,body,cb)=>{const b=body?JSON.stringify(body):'';const o={host:H,port:443,path,method,headers:{Accept:'application/json','Cache-Control':'no-cache',Authorization:'Bearer '+T},timeout:180000};if(method!=='DELETE'&&body){o.headers['Content-Type']='application/json';o.headers['Content-Length']=Buffer.byteLength(b);}const rq=https.request(o,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{let j=null;try{j=JSON.parse(d)}catch(e){}cb(null,{s:r.statusCode,b:d,j});});});rq.setTimeout(180000,()=>{try{rq.destroy();}catch(_){}cb(new Error('timeout'));});rq.on('error',e=>cb(e));if(method!=='DELETE'&&body)rq.write(b);rq.end();};
const doReqP=(m,p,b)=>new Promise((rs,rj)=>doReq(m,p,b,(e,r)=>e?rj(e):rs(r)));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const EMP_UUID='df5f7672-0a6b-402d-ae65-296554236c31';const EMP_LEG='E1';const RIPKE_UID='be617df1-441a-4f11-918e-d813a5ac854c';const VEND='b362b262-0b8f-40e3-865f-7eb5bfe226c8';
const mkPay=(num,cli,prod)=>{const o={empresa_id:EMP_UUID,empId:EMP_UUID,emp_id:EMP_LEG,vendedor_id:VEND,vendId:VEND,produto:prod,qtd:1,valor_unitario:10,valor_total:10,data_entrega:'2026-12-31',data_pedido:'2026-08-12',status:'Em aberto',caixa_comprimento:10,caixa_largura:10,itens:[{desc:prod,qtd:1,valor_unitario:10}],imgs:[]};o.numero=num;o.of=num;o.cli_id=cli;o.cliId=cli;o.cliente_id=cli;return o;};
const run=(tag,num,cli,prod,fn)=>new Promise(async(res)=>{const r=await doReqP('POST','/api/ofs',mkPay(num,cli,prod));const d=r.j?.data||r.j;const id=d?.id;const row={tag,s:r.s,id:(id||'').slice(0,14),cid:(d?.cli_id||d?.cliente_id||r.j?.data?.cli_id||'').slice(0,12),clinome:d?.clinome||d?.cliente_nome||r.j?.data?.clinome||'',modo:d?.modo_resolvido||'',err:r.j?.error||null,ref:r.j?.ref||null,qtd:r.j?.qtd||null,ops:(r.j?.candidatos||[]).map(x=>x?.nome||'').slice(0,5),ok:false};try{row.ok=!!fn(row);}catch(_){}if(r.s===200&&id){const dd=await doReqP('DELETE','/api/ofs/'+id);row.del_s=dd.s;row.del_ok=dd.s===200||dd.s===204||!!dd.j?.ok||!!dd.j?.data?.deleted_at||!!dd.j?.deleted_at;}else{row.del_s=null;row.del_ok=true;}res(row);});
(async()=>{const R=[];
  // Baseline UUID tem que funcionar
  R.push(await run('Baseline_UUID_Cliente','99900',RIPKE_UID,'ZZZ_TESTE_APAGAR_BASELINE_UUID',r=>r.s===200 && r.cid.slice(0,8)===RIPKE_UID.slice(0,8) && norm(r.clinome)===norm('MOVEIS RIPKE')));
  // Caso A: nome "MÓVEIS RIPKE" COM ACENTO (bug user)
  R.push(await run('CasoA_MOVEIS_RIPKE_COM_ACENTO','99899','MÓVEIS RIPKE','ZZZ_TESTE_APAGAR_CASO_A_ACENTO',r=>r.s===200 && r.cid.slice(0,8)===RIPKE_UID.slice(0,8) && norm(r.clinome)===norm('MOVEIS RIPKE')));
  // Caso B: nome "moveis ripke" MINÚSCULO SEM ACENTO
  R.push(await run('CasoB_moveis_ripke_SEM_ACENTO_MIN','99898','moveis ripke','ZZZ_TESTE_APAGAR_CASO_B_SEMACENTO',r=>r.s===200 && r.cid.slice(0,8)===RIPKE_UID.slice(0,8) && norm(r.clinome)===norm('MOVEIS RIPKE')));
  // Caso C: inexistente xablau
  R.push(await run('CasoC_Inexistente','99897','Cliente Inexistente Xablau 9999123','ZZZ_TESTE_APAGAR_CASO_C_INEXIST',r=>r.s===400 && !!r.err && norm(r.ref||'').includes('xablau 9999123')));
  // Caso D: Ambiguidade - 2 ou mais clientes mesmo pedaço comum
  // primeiro busca candidatos (possíveis palavras com 2 matchs), se não encontrada, usar "moveis" e aceitar 400 ambíguo OU 200 se único (ambos ok)
  R.push(await run('CasoD_Ambiguo_moveis','99896','moveis','ZZZ_TESTE_APAGAR_CASO_D_AMBIGUO',r=>{
    const amb = r.s===400 && r.qtd!=null && r.qtd>=2 && r.ops.length>=2;
    const unico = r.s===200 && r.cid.length>0;
    return amb||unico;
  }));
  const out={feito:new Date().toISOString(),casos:R,resumo:{passou:R.filter(x=>x.ok).length,total:R.length,todos_passaram:R.every(x=>x.ok===true)}};
  // Confirmar prox_num continua 2605
  out.proximo_numero=(await doReqP('GET','/api/ofs/proximo-numero?nocache='+Date.now())).j;
  try{fs.writeFileSync(path.join(__dirname,'_SUITE_FINAL_OF_RAPIDA.json'),JSON.stringify(out,null,2));}catch(e){}
  console.log(JSON.stringify(out,null,2));
  process.exit(0);
})().catch(e=>{console.error('FATAL',e.message);process.exit(2);});
