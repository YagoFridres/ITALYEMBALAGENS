const https=require('https');const fs=require('fs');const path=require('path');const jwt=require(path.join(__dirname,'node_modules/jsonwebtoken'));const T=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'2h'});const p=__dirname;
const G=(u,tm)=>new Promise(R=>{const t0=Date.now();const hdr={Accept:'application/json','Cache-Control':'no-cache',Authorization:'Bearer '+T};const o={host:'adm.italyembalagens.com.br',port:443,path:u,method:'GET',headers:hdr,timeout:tm||30000};const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{let j;try{j=JSON.parse(b)}catch(e){j={pe:e.message,r:b.slice(0,4000)}};R({ms:Date.now()-t0,s:r.statusCode,j,raw:b.slice(0,5000)});});});rq.setTimeout(tm||30000,()=>{try{rq.destroy();}catch(_){}R({ne:'TIMEOUT',tm:Date.now()-t0});});rq.on('error',e=>R({ne:String(e?.message||e)}));rq.end();});
const D=(u,tm)=>new Promise(R=>{const t0=Date.now();const hdr={Accept:'application/json','Cache-Control':'no-cache',Authorization:'Bearer '+T};const o={host:'adm.italyembalagens.com.br',port:443,path:u,method:'DELETE',headers:hdr,timeout:tm||30000};const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{let j;try{j=JSON.parse(b)}catch(e){j={pe:e.message,r:b.slice(0,4000)}};R({ms:Date.now()-t0,s:r.statusCode,j,raw:b.slice(0,5000)});});});rq.setTimeout(tm||30000,()=>{try{rq.destroy();}catch(_){}R({ne:'TIMEOUT',tm:Date.now()-t0});});rq.on('error',e=>R({ne:String(e?.message||e)}));rq.end();});
const P=(u,body,tm)=>new Promise(R=>{const bdy=JSON.stringify(body||{});const t0=Date.now();const hdr={'Content-Type':'application/json','Content-Length':Buffer.byteLength(bdy),Accept:'application/json','Cache-Control':'no-cache',Authorization:'Bearer '+T};const o={host:'adm.italyembalagens.com.br',port:443,path:u,method:'POST',headers:hdr,timeout:tm||60000};const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{let j;try{j=JSON.parse(b)}catch(e){j={pe:e.message,r:b.slice(0,4000)}};R({ms:Date.now()-t0,s:r.statusCode,j,raw:b.slice(0,3000)});});});rq.setTimeout(tm||60000,()=>{try{rq.destroy();}catch(_){}R({ne:'TIMEOUT',tm:Date.now()-t0});});rq.on('error',e=>R({ne:String(e?.message||e)}));rq.write(bdy);rq.end();});
(async()=>{
  const out={feito_em:new Date().toISOString()};
  out.del_of_teste=await D('/api/ofs/2485ce9d-a0be-4d76-9935-76f12695a0b9',30000);
  out.busca_placeholder=await G('/api/clientes?search='+encodeURIComponent('NOME REAL AQUI')+'&limit=20&incluir_inativos=true',30000);
  const placeholders=Array.isArray(out.busca_placeholder.j?.data)?out.busca_placeholder.j.data:[];
  out.placeholders=placeholders.map(c=>({id:c.id,nome:c.nome,ativo:c.ativo,empresa_id:c.empresa_id||c.empId||null,total_ofs:Number(c.total_ofs||0),created_at:c.created_at||null}));
  out.teste_placeholder_ofs=[];let n=99996;
  for(const ph of out.placeholders){
    const payload={numero:String(n),cli_id:ph.id,cliId:ph.id,cliente_id:ph.id,produto:'ZZZ_TESTE_APAGAR_P2_PLACEHOLDER_TESTE',descricao:'ZZZ_TESTE_APAGAR_P2',qtd:1,quantidade:1,vunit:10,valor_unitario:10,valor_total:10,data_entrega:'2026-12-31',data_pedido:'2026-08-12',status:'Em aberto',emp_id:'E1',empId:'E1',caixa_comprimento:10,dim_comprimento:10,caixa_largura:10,dim_largura:10,cores_impressao:[],itens:[{desc:'ZZZ_TESTE_APAGAR_P2',qtd:1,vunit:10}],imgs:[],urg:false};
    const r=await P('/api/ofs',payload,60000);
    out.teste_placeholder_ofs.push({placeholder_nome:ph.nome,placeholder_id:ph.id,numero_para_teste:n,http_s:r.s,error:r?.j?.error||null,of_id:r?.j?.data?.id||null});
    if(r.s===200 && r?.j?.data?.id){const d=await D('/api/ofs/'+r.j.data.id,30000);out.teste_placeholder_ofs[out.teste_placeholder_ofs.length-1].soft_delete=r.s;}
    n--;
  }
  try{fs.writeFileSync(path.join(p,'_CAUSA_EXATA_OF_RAPIDA.json'),JSON.stringify(out,null,2));}catch(err){try{fs.writeFileSync(path.join(p,'_CAUSA_ERR.txt'),String(err?.message||err));}catch(_){}}
  process.exit(0);
})().catch(e=>{try{fs.writeFileSync(path.join(p,'_CAUSA_CATCH.txt'),String(e?.message||e));}catch(_){}process.exit(2);});
