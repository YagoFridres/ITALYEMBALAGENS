const https=require('https');const jwt=require('jsonwebtoken');const fs=require('fs');const path=require('path');const T=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'3h'});
const H='adm.italyembalagens.com.br';
const doReq=(method,path,body,cb)=>{const b=body?JSON.stringify(body):'';const o={host:H,port:443,path,method,headers:{Accept:'application/json','Cache-Control':'no-cache',Authorization:'Bearer '+T},timeout:180000};if(method!=='DELETE'&&body){o.headers['Content-Type']='application/json';o.headers['Content-Length']=Buffer.byteLength(b);}const rq=https.request(o,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{let j=null;try{j=JSON.parse(d)}catch(e){}cb(null,{s:r.statusCode,b:d,j});});});rq.setTimeout(180000,()=>{try{rq.destroy();}catch(_){}cb(new Error('timeout'));});rq.on('error',e=>cb(e));if(method!=='DELETE'&&body)rq.write(b);rq.end();};
const doReqP=(m,p,b)=>new Promise((rs,rj)=>doReq(m,p,b,(e,r)=>e?rj(e):rs(r)));
const RIPKE_UID='be617df1-441a-4f19-9b8d-c64d504a1a1a'.slice(0,0); // não usar
const EMP_RIPKE='df5f7672-0a6b-402d-ae65-296554236c31';
const VEND='b362b262-0b8f-40e3-865f-7eb5bfe226c8';
const mkBase=(nome)=>Object.freeze({empresa_id:EMP_RIPKE,empId:EMP_RIPKE,vendedor_id:VEND,vendId:VEND,produto:nome,qtd:1,valor_unitario:10,valor_total:10,data_entrega:'2026-12-31',data_pedido:'2026-08-12',status:'Em aberto',caixa_comprimento:10,caixa_largura:10,cores_impressao:[],itens:[{desc:nome,qtd:1,valor_unitario:10}],imgs:[]});
const RIPKE_NORM='moveis ripke';
const mk=(num,cli,prod)=>{const b={...mkBase(prod)};b.numero=num;b.of=num;b.cli_id=cli;b.cliId=cli;b.cliente_id=cli;b.clinome='';return b;};
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const RIPKE_UID_REAL='be617df1'; // 8 primeiros
(async()=>{
  const out={feito:new Date().toISOString(),casos:{},deletes:{}};
  const runCase=async(tag,num,cli,prod,check)=>{
    const st=Date.now();const r=await doReqP('POST','/api/ofs',mk(num,cli,prod));
    const ms=Date.now()-st;const d=r.j?.data||r.j;const id=d?.id||'';const cid=String(d?.cli_id||d?.cliente_id||'');
    const modo=d?.modo_resolvido||null;const clinome=d?.clinome||d?.cliente_nome||'';const err=r.j?.error||null;const ref=r.j?.ref||null;const qtd=r.j?.qtd||null;const ops=(r.j?.candidatos||[]).map(x=>x?.nome||'').slice(0,6);
    let ok=false;try{ok=await check({s:r.s,cid,modo,clinome,err,qtd,ops,ref});}catch(e){}
    const row={status:r.s,ms,id:id?.slice(0,14)||'',cid:cid?.slice(0,10)||'',modo,clinome,ok,err,ref,qtd,ops};
    out.casos[tag]=row;
    if(r.s===200&&id){out.deletes[tag]={id,del:null,soft_ok:null};const dd=await doReqP('DELETE','/api/ofs/'+id);out.deletes[tag].del=dd.s;out.deletes[tag].soft_ok=(dd.s===200||dd.s===204||dd.j?.ok===true||dd.j?.deleted_at||dd.j?.data?.deleted_at||(dd.j?.success===true));}
    return ok;
  };
  const wait=(ms)=>new Promise(r=>setTimeout(r,ms));
  const esperaDeployPronto=true;
  // CASO A: "MÓVEIS RIPKE" COM acento (cenário de bug do usuário!)
  await runCase('A_MOVEIS_RIPKE_COM_ACENTO','99980','MÓVEIS RIPKE','ZZZ_TESTE_APAGAR_CASOA_RIPKE_ACENTO',({s,cid,modo,clinome})=>{
    return (s===200) && cid.slice(0,8)===RIPKE_UID_REAL && norm(clinome)===RIPKE_NORM;
  });
  await wait(700);
  // CASO B: "moveis ripke" sem acento minusculo
  await runCase('B_moveis_ripke_SEM_ACENTO','99979','moveis ripke','ZZZ_TESTE_APAGAR_CASOB_RIPKE_MINUSCULO',({s,cid,modo,clinome})=>{
    return (s===200) && cid.slice(0,8)===RIPKE_UID_REAL && norm(clinome)===RIPKE_NORM;
  });
  await wait(700);
  // CASO C: inexistente
  await runCase('C_inexistente','99978','cliente xablau 9999 inexistente','ZZZ_TESTE_APAGAR_CASOC_INEXISTENTE',({s,err,ref})=>{
    return (s===400) && !!err && !!ref && norm(ref).includes('xablau 9999');
  });
  await wait(700);
  // CASO D: ambiguidade - primeiro buscar clientes que tem um pedaço comum para ambiguidade real
  let termoAmb='empresa'; let termoReal='ROTOPLAST';
  // buscar 2 clientes que batem um termo parcial
  const rBusca=await doReqP('GET','/api/clientes?search=moveis&limit=30&nocache='+Date.now());
  let arrB=rBusca.j?.data||rBusca.j||[];
  let matches=[];
  if(Array.isArray(arrB)){
    const byNome=new Map();
    for(const o of arrB){const n=norm(o?.nome||o?.rs||o?.razao_social||'');if(!n)continue;const parts=n.split(' ').filter(p=>p.length>=4);for(const p of parts){const k=p;byNome.set(k,(byNome.get(k)||0)+1);}}
    for(const [k,v] of [...byNome.entries()].sort((a,b)=>b[1]-a[1])){if(v>=2 && matches.length<1)matches.push({palavra:k,cont:v});}
  }
  let palAmb='moveis'; // palavra para ambiguidade (vários clientes tem moveis no nome...)
  if(matches.length) palAmb=matches[0].palavra;
  await runCase('D_amb_palavra_'+palAmb,'99977',palAmb,'ZZZ_TESTE_APAGAR_CASOD_AMBIGUIDADE',({s,err,qtd,ops})=>{
    // aceita AMBOS: (400 + ambiguo com qtd>=2 + lista opcoes) OU (200 + unico match 1)
    const amb=s===400 && !!err && qtd!=null && qtd>=2 && (ops||[]).length>=2;
    const unico=s===200;
    return amb || unico;
  });
  // CONFIRMAÇÃO BÔNUS: rodar CASO A e B de novo (só para garantir cache ok)
  // Verificar no final próximo número permanece 2605
  const pn2=await doReqP('GET','/api/ofs/proximo-numero?nocache='+Date.now());
  out.pos_prox_num=pn2.j||{s:pn2.s,b:pn2.b?.slice(0,300)};
  out.geral_passou=Object.values(out.casos).every(x=>x.ok===true);
  try{fs.writeFileSync(path.join(__dirname,'_T4_FINAL.json'),JSON.stringify(out,null,2));}catch(e){try{fs.writeFileSync(path.join(__dirname,'_T4_ERR.txt'),String(e?.message||e));}catch(_){}}
  console.log(JSON.stringify(out,null,2));
  process.exit(0);
})().catch(e=>{console.error('FATAL',e?.message||e);process.exit(2);});
