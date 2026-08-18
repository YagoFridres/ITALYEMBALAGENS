const https=require('https');const fs=require('fs');const path=require('path');const jwt=require(path.join(__dirname,'node_modules/jsonwebtoken'));const T=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'3h'});const p=__dirname;
const GET=(u,tm)=>new Promise(R=>{const t0=Date.now();const hdr={Accept:'application/json','Cache-Control':'no-cache',Authorization:'Bearer '+T};const o={host:'adm.italyembalagens.com.br',port:443,path:u,method:'GET',headers:hdr,timeout:tm||60000};const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{let j;try{j=JSON.parse(b)}catch(e){j={pe:e.message,r:b.slice(0,2000)}};R({ms:Date.now()-t0,s:r.statusCode,j,raw:b.slice(0,4000)});});});rq.setTimeout(tm||60000,()=>{try{rq.destroy();}catch(_){}R({ne:'TIMEOUT',tm:Date.now()-t0});});rq.on('error',e=>R({ne:String(e?.message||e)}));rq.end();});
const PRE=(u,body,tm,mtd)=>new Promise(R=>{const bdy=(mtd && mtd!=='DELETE')?JSON.stringify(body||{}):'';const t0=Date.now();const hdr={Accept:'application/json','Cache-Control':'no-cache',Authorization:'Bearer '+T};if(mtd!=='DELETE'){hdr['Content-Type']='application/json';hdr['Content-Length']=Buffer.byteLength(bdy);}const o={host:'adm.italyembalagens.com.br',port:443,path:u,method:mtd||'POST',headers:hdr,timeout:tm||60000};const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{let j;try{j=JSON.parse(b)}catch(e){j={pe:e.message,r:b.slice(0,2000)}};R({ms:Date.now()-t0,s:r.statusCode,j,raw:b.slice(0,5000)});});});rq.setTimeout(tm||60000,()=>{try{rq.destroy();}catch(_){}R({ne:'TIMEOUT',tm:Date.now()-t0});});rq.on('error',e=>R({ne:String(e?.message||e)}));if(mtd!=='DELETE' && bdy){rq.write(bdy);}rq.end();});
const P=(u,body,tm)=>PRE(u,body,tm,'POST');
const DEL=(u,tm)=>PRE(u,null,tm,'DELETE');
const baseBase={vendedor_id:'b362b262-0b8f-40e3-865f-7eb5bfe226c8',vendId:'b362b262-0b8f-40e3-865f-7eb5bfe226c8',produto:'ZZZ_TESTE_APAGAR_P5_OFRAPIDA',qtd:1,valor_unitario:10,valor_total:10,data_entrega:'2026-12-31',data_pedido:'2026-08-12',status:'Em aberto',emp_id:'E1',empId:'E1',caixa_comprimento:10,caixa_largura:10,cores_impressao:[],itens:[{desc:'ZZZ_TESTE_APAGAR_P5_OFRAPIDA',qtd:1,valor_unitario:10}],imgs:[]};
( async () => {
  const out = { feito_em: new Date().toISOString(), deploy: {}, prox_num: {}, casos: {}, deletes: {} };
  // POLL DEPLOY
  const alvo = '20260812105000';
  for (let i = 1; i <= 30; i++) {
    const r = await GET('/api/health?nocache=' + Date.now() + '_' + i, 20000);
    const pv = String(r?.j?.PATCH_VERSION || r?.j?.patch || r?.j?.runtime_version || r?.j?.patch_version || r?.j?.version || r?.j?.v || '').trim();
    const sw = String(r?.j?.SW_VERSION || r?.j?.sw || '').trim();
    const com = String(r?.j?.APP_GIT_COMMIT_SHA || r?.j?.commit || r?.j?.sha || '').trim();
    const healthStatus = { rodada: i, ms: r.ms, status: r.s, patch: pv, sw: sw, commit: com.slice(0,7) };
    out.deploy['t'+i] = healthStatus;
    if (pv === alvo || sw === alvo || com === '305af98') { out.deploy.ok = true; out.deploy.encontrado_em = i; break; }
    await new Promise(rr => setTimeout(rr, 2500));
  }
  // PROXIMO NUMERO
  {
    const r = await GET('/api/ofs/proximo-numero?nocache=' + Date.now(), 60000);
    out.prox_num = { status: r.s, ms: r.ms, maior: r?.j?.maior ?? null, proximo: r?.j?.proximo ?? null, erro: r?.j?.erro || null, ok: r?.j?.ok ?? null };
  }
  // CASO A
  {
    const num = '99970'; const cli = 'MÓVEIS RIPKE';
    const r = await P('/api/ofs', {...baseBase, numero: num, of: num, cli_id: cli, cliId: cli, cliente_id: cli}, 60000);
    const id = String(r?.j?.data?.id || r?.j?.id || '').trim();
    out.casos.A_com_acento_MOVEIS_RIPKE = { status: r.s, ms: r.ms, id, clinome: r?.j?.data?.clinome || r?.j?.clinome || null, modo: r?.j?.data?.modo_resolvido || null, erro: r?.j?.error || null, ref: r?.j?.ref || null, ambiguo: r?.j?.qtd || null, opcoes: (r?.j?.candidatos||[]).map(x=>x?.nome||'').slice(0,6) };
    if (r.s === 200 && id) out.deletes['A_'+id] = await DEL('/api/ofs/'+id, 60000);
  }
  // CASO B
  {
    const num = '99969'; const cli = 'moveis ripke';
    const r = await P('/api/ofs', {...baseBase, numero: num, of: num, cli_id: cli, cliId: cli, cliente_id: cli}, 60000);
    const id = String(r?.j?.data?.id || r?.j?.id || '').trim();
    out.casos.B_SEM_acento_moveis_ripke = { status: r.s, ms: r.ms, id, clinome: r?.j?.data?.clinome || r?.j?.clinome || null, modo: r?.j?.data?.modo_resolvido || null, erro: r?.j?.error || null, ref: r?.j?.ref || null, ambiguo: r?.j?.qtd || null, opcoes: (r?.j?.candidatos||[]).map(x=>x?.nome||'').slice(0,6) };
    if (r.s === 200 && id) out.deletes['B_'+id] = await DEL('/api/ofs/'+id, 60000);
  }
  // CASO C
  {
    const num = '99968'; const cli = 'moveis ripke xablau inexistente 123987';
    const r = await P('/api/ofs', {...baseBase, numero: num, of: num, cli_id: cli, cliId: cli, cliente_id: cli}, 60000);
    const id = String(r?.j?.data?.id || r?.j?.id || '').trim();
    out.casos.C_inexistente = { status: r.s, ms: r.ms, id, erro: r?.j?.error || null, ref: r?.j?.ref || null, missing: r?.j?.missing || null };
    if (r.s === 200 && id) out.deletes['C_'+id] = await DEL('/api/ofs/'+id, 60000);
  }
  // CASO D
  {
    const num = '99967'; const cli = 'RIPKE';
    const r = await P('/api/ofs', {...baseBase, numero: num, of: num, cli_id: cli, cliId: cli, cliente_id: cli}, 60000);
    const id = String(r?.j?.data?.id || r?.j?.id || '').trim();
    out.casos.D_ambiguidade = { status: r.s, ms: r.ms, id, clinome: r?.j?.data?.clinome || r?.j?.clinome || null, erro: r?.j?.error || null, ref: r?.j?.ref || null, ambiguo: r?.j?.qtd || null, opcoes: (r?.j?.candidatos||[]).map(x=>x?.nome||'').slice(0,8) };
    if (r.s === 200 && id) out.deletes['D_'+id] = await DEL('/api/ofs/'+id, 60000);
  }
  try{fs.writeFileSync(path.join(p,'_DEPLOY_TESTE_OF_RAPIDA.json'),JSON.stringify(out,null,2));}catch(e){try{fs.writeFileSync(path.join(p,'_DEPLOY_TESTE_ERR.txt'),String(e?.message||e));}catch(_){}}
  process.exit(0);
})().catch(e=>{try{fs.writeFileSync(path.join(p,'_DEPLOY_TESTE_CATCH.txt'),String(e?.message||e));}catch(_){}process.exit(2);});
