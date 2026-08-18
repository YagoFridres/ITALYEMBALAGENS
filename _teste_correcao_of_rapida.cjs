const https=require('https');const fs=require('fs');const path=require('path');const jwt=require(path.join(__dirname,'node_modules/jsonwebtoken'));const T=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'2h'});const p=__dirname;
const PRE=(u,body,tm,mtd)=>new Promise(R=>{const bdy=(mtd && mtd!=='DELETE')?JSON.stringify(body||{}):'';const t0=Date.now();const hdr={Accept:'application/json','Cache-Control':'no-cache',Authorization:'Bearer '+T};if(mtd!=='DELETE'){hdr['Content-Type']='application/json';hdr['Content-Length']=Buffer.byteLength(bdy);}const o={host:'adm.italyembalagens.com.br',port:443,path:u,method:mtd||'POST',headers:hdr,timeout:tm||60000};const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{let j;try{j=JSON.parse(b)}catch(e){j={pe:e.message,r:b.slice(0,2000)}};R({ms:Date.now()-t0,s:r.statusCode,j,raw:b.slice(0,3500)});});});rq.setTimeout(tm||60000,()=>{try{rq.destroy();}catch(_){}R({ne:'TIMEOUT',tm:Date.now()-t0});});rq.on('error',e=>R({ne:String(e?.message||e)}));if(mtd!=='DELETE' && bdy){rq.write(bdy);}rq.end();});
const P=(u,body,tm)=>PRE(u,body,tm,'POST');
const DEL=(u,tm)=>PRE(u,null,tm,'DELETE');
const base={vendedor_id:'b362b262-0b8f-40e3-865f-7eb5bfe226c8',vendId:'b362b262-0b8f-40e3-865f-7eb5bfe226c8',produto:'ZZZ_TESTE_APAGAR_P4_CORRIGE_OFRAPIDA',qtd:1,valor_unitario:10,valor_total:10,data_entrega:'2026-12-31',data_pedido:'2026-08-12',status:'Em aberto',emp_id:'E1',empId:'E1',caixa_comprimento:10,caixa_largura:10,cores_impressao:[],itens:[{desc:'ZZZ_TESTE_APAGAR_P4_CORRIGE_OFRAPIDA',qtd:1,valor_unitario:10}],imgs:[]};
const extraiId = (r) => String((r && r.j && (r.j.data?.id || r.j.id || (Array.isArray(r.j.data) ? r.j.data[0]?.id : null))) || '').trim();
const extraiNome = (r) => String((r && r.j && (r.j.data?.clinome || r.j.data?.cliNome || r.j.data?.cliente_nome || r.j.clinome || r.j.nome)) || '').trim();
const extraiModo = (r) => String((r && r.j && (r.j.data?.modo_resolvido || r.j.modo_resolvido || r.j.data?.cli_id)) || '').trim();
( async () => {
  const out = { feito_em: new Date().toISOString(), testes: {}, soft_deletes: {} };
  // CASO A: "MÓVEIS RIPKE" (com acento, nome completo digitado SEM clicar datalist)
  {
    const num = '99980';
    const r = await P('/api/ofs', {...base, numero: num, of: num, cli_id:'MÓVEIS RIPKE', cliId:'MÓVEIS RIPKE', cliente_id:'MÓVEIS RIPKE'}, 60000);
    const id = extraiId(r);
    out.testes.caso_A_moveis_ripke_com_acento = { status: r.s, ms: r.ms, id, clinome: extraiNome(r), modo: extraiModo(r), erro: r?.j?.error || null, qtd_ambiguo: r?.j?.qtd || null };
    if (r.s === 200 && id) {
      out.soft_deletes['99980_'+id] = await DEL('/api/ofs/'+id, 60000);
    }
  }
  // CASO B: "moveis ripke" (SEM acento, minusculo, normalizado)
  {
    const num = '99979';
    const r = await P('/api/ofs', {...base, numero: num, of: num, cli_id:'moveis ripke', cliId:'moveis ripke', cliente_id:'moveis ripke'}, 60000);
    const id = extraiId(r);
    out.testes.caso_B_moveis_ripke_SEM_acento = { status: r.s, ms: r.ms, id, clinome: extraiNome(r), modo: extraiModo(r), erro: r?.j?.error || null, qtd_ambiguo: r?.j?.qtd || null };
    if (r.s === 200 && id) {
      out.soft_deletes['99979_'+id] = await DEL('/api/ofs/'+id, 60000);
    }
  }
  // CASO C: NOME INEXISTENTE "moveis ripke xablau inexistente 123987" → msg detalhada
  {
    const num = '99978';
    const r = await P('/api/ofs', {...base, numero: num, of: num, cli_id:'moveis ripke xablau inexistente 123987', cliId:'moveis ripke xablau inexistente 123987', cliente_id:'moveis ripke xablau inexistente 123987'}, 60000);
    const id = extraiId(r);
    out.testes.caso_C_inexistente_msg_detalhada = { status: r.s, ms: r.ms, id, erro: r?.j?.error || null, missing: r?.j?.missing || null, ref: r?.j?.ref || null };
    if (r.s === 200 && id) {
      out.soft_deletes['99978_'+id] = await DEL('/api/ofs/'+id, 60000);
    }
  }
  // CASO D: "RIPKE" (parcial, testa ambiguidade se mais de um cliente comecar ou conter ripke)
  {
    const num = '99977';
    const r = await P('/api/ofs', {...base, numero: num, of: num, cli_id:'RIPKE', cliId:'RIPKE', cliente_id:'RIPKE'}, 60000);
    const id = extraiId(r);
    out.testes.caso_D_ripke_parcial_ambiguidade = { status: r.s, ms: r.ms, id, clinome: extraiNome(r), modo: extraiModo(r), erro: r?.j?.error || null, qtd_ambiguo: r?.j?.qtd || null, opcoes: (r?.j?.candidatos || []).map(c=>c?.nome || '').slice(0,8) };
    if (r.s === 200 && id) {
      out.soft_deletes['99977_'+id] = await DEL('/api/ofs/'+id, 60000);
    }
  }
  try{fs.writeFileSync(path.join(p,'_TESTE_CORRECAO_OF_RAPIDA.json'),JSON.stringify(out,null,2));}catch(e){try{fs.writeFileSync(path.join(p,'_TESTE_CORR_ERR.txt'),String(e?.message||e));}catch(_){}}
  process.exit(0);
})().catch(e=>{try{fs.writeFileSync(path.join(p,'_TESTE_CORR_CATCH.txt'),String(e?.message||e));}catch(_){}process.exit(2);});
