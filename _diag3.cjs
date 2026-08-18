const https=require('https');const fs=require('fs');const path=require('path');const jwt=require(path.join(__dirname,'node_modules/jsonwebtoken'));const T=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'2h'});const p=__dirname;let S=[];
const L=(m)=>{const t=new Date().toISOString();const ln=t+' '+String(m||'');S.push(ln);try{fs.appendFileSync(path.join(p,'_diag3.log.txt'),ln.replace(/\r?\n/g,' | ')+'\n');}catch(_){}};
function G(u,tm){return new Promise(R=>{const t0=Date.now();const hdr={Accept:'application/json','Cache-Control':'no-cache','Pragma':'no-cache',Authorization:'Bearer '+T};const o={host:'adm.italyembalagens.com.br',port:443,path:u,method:'GET',headers:hdr,timeout:tm||45000};const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{let j;try{j=JSON.parse(b)}catch(e){j={pe:e.message,r:b.slice(0,500)}};R({ms:Date.now()-t0,s:r.statusCode,j,len:b.length});});});rq.setTimeout(tm||45000,()=>{try{rq.destroy(new Error('tm'));}catch(_){}R({ne:'TIMEOUT',tm:Date.now()-t0});});rq.on('error',e=>R({ne:String(e?.message||e)}));rq.end();});}
function P(u,body,tm){return new Promise(R=>{const bdy=JSON.stringify(body||{});const t0=Date.now();const hdr={'Content-Type':'application/json','Content-Length':Buffer.byteLength(bdy),Accept:'application/json','Cache-Control':'no-cache',Authorization:'Bearer '+T};const o={host:'adm.italyembalagens.com.br',port:443,path:u,method:'POST',headers:hdr,timeout:tm||60000};const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{let j;try{j=JSON.parse(b)}catch(e){j={pe:e.message,r:b.slice(0,1000)}};R({ms:Date.now()-t0,s:r.statusCode,j,raw:b.slice(0,2500)});});});rq.setTimeout(tm||60000,()=>{try{rq.destroy(new Error('tm'));}catch(_){}R({ne:'TIMEOUT',tm:Date.now()-t0});});rq.on('error',e=>R({ne:String(e?.message||e)}));rq.write(bdy);rq.end();});}
(async()=>{
  L('BOOT Railway AO VIVO');
  const v=await G('/api/version',20000);L('version s='+v.s+' patch='+String(v?.j?.runtime?.patch||'?')+' commit='+String(v?.j?.git?.commit||'?'));
  for(const u of ['/api/ofs?limit=3','/api/maquinas','/api/cores-impressao']){
    for(let i=1;i<=3;i++){const r=await G(u,30000);L('GET '+u+' #'+i+' s='+r.s+' ms='+r.ms+' len='+(r.len||0)+' ne='+String(r.ne||''));}
  }
  const payloadValido={
    numero:'99999',cli_id:'be617df1-441a-4f11-918e-d813a5ac854c',cliId:'be617df1-441a-4f11-918e-d813a5ac854c',cliente_id:'be617df1-441a-4f11-918e-d813a5ac854c',
    produto:'ZZZ_TESTE_APAGAR_P1_DIAG cliente inválido',descricao:'ZZZ_TESTE_APAGAR_P1',qtd:1,quantidade:1,vunit:10,valor_unitario:10,valor_total:10,
    data_entrega:'2026-12-31',data_pedido:'2026-08-12',status:'Em aberto',emp_id:'E1',empId:'E1',
    caixa_comprimento:10,dim_comprimento:10,caixa_largura:10,dim_largura:10,
    cores_impressao:[],itens:[{desc:'ZZZ_TESTE_APAGAR_P1',descricao:'ZZZ_TESTE_APAGAR_P1',qtd:1,quantidade:1,vunit:10,valor_unitario:10,valor_total:10,maquina:''}],imgs:[],
    urg:false,urgente:false,maquina_agendada:undefined,fluxo_maquinas:[]
  };
  const rv=await P('/api/ofs',payloadValido,60000);L('POST /api/ofs VALIDO (Ripke uuid) s='+rv.s+' ms='+rv.ms+' j='+JSON.stringify(rv.j||{}).slice(0,1500));
  const payloadInvalidoNome={...payloadValido,numero:'99998',cli_id:'',cliId:'',cliente_id:''};
  const re1=await P('/api/ofs',payloadInvalidoNome,60000);L('POST /api/ofs CLI_ID_VAZIO s='+re1.s+' ms='+re1.ms+' jerr='+String(re1?.j?.error||''));
  const payloadInvalidoUUID={...payloadValido,numero:'99997',cli_id:'00000000-0000-0000-0000-000000000000',cliId:'00000000-0000-0000-0000-000000000000',cliente_id:'00000000-0000-0000-0000-000000000000'};
  const re2=await P('/api/ofs',payloadInvalidoUUID,60000);L('POST /api/ofs UUID_INEXISTENTE s='+re2.s+' ms='+re2.ms+' jerr='+String(re2?.j?.error||''));
  try{fs.writeFileSync(path.join(p,'_DIAG3_REPORT.json'),JSON.stringify({feito_em:new Date().toISOString(),testes:Array.from(S)},null,2));}catch(err){L('WRITE_ERR '+String(err?.message||err));}
  process.exit(0);
})().catch(e=>{L('CAT '+String(e?.message||e));try{fs.writeFileSync(path.join(p,'_DIAG3_CATCH.txt'),String(e?.message||e));}catch(_){}process.exit(2);});
