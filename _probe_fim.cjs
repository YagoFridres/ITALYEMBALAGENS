const https = require('https');
const TOK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRpYWctbG9jYWwtcHJvYmUtMDAwMSIsIm5vbWUiOiJEaWFnIExvY2FsIFByb2JlIiwiZW1haWwiOiJkaWFnQGxvY2FsIiwicGVyZmlsIjoiYWRtaW4iLCJwZXJtaXNzb2VzIjpbInR1ZG8iXSwiYXZhdGFyX3VybCI6bnVsbCwiaWF0IjoxNzg2NjIwNjQ3LCJleHAiOjE3ODY2NDIyNDd9.vZAQV_znvnWr6L0bZf6C17TDw6n3kYX1hfMS-6Sz6z0';
const headers = { 'Authorization':'Bearer '+TOK, 'Accept':'application/json','User-Agent':'node-diag/2.0' };
function req(method, path){
  return new Promise((res)=>{
    const url = new URL('https://adm.italyembalagens.com.br'+path);
    const opts = { method, hostname:url.hostname, port:443, path:url.pathname+url.search, timeout: 45000, headers };
    const rq = https.request(opts, r=>{ let d=''; r.on('data',c=>d+=c); r.on('end',()=>res({status:r.statusCode, body:d})); });
    rq.on('error', e=>res({err:e.message}));
    rq.on('timeout', ()=>{ rq.destroy(new Error('timeout')); });
    rq.end();
  });
}
async function main(){
  const fs = require('fs');
  const outDir = 'c:/Users/Usuario/PCP PROGRAMA/ITALYEMBALAGENS';
  const save = (name, obj) => fs.writeFileSync(outDir+'/'+name, Buffer.from(JSON.stringify(obj, null, 2), 'utf8'));

  console.log('(A) proximo-numero...');
  const a = await req('GET','/api/ofs/proximo-numero?t='+Date.now());
  let aJson = { raw:a };
  try{ aJson = JSON.parse(a.body||'{}'); }catch(e){ aJson.parseErr = e.message; }
  save('_A_proximo.json', aJson);
  console.log('  A status='+a.status+' proximo='+JSON.stringify(aJson.proximo)+' maior='+JSON.stringify(aJson.maior));

  console.log('(B) diag_proxnum (timeout 90s)...');
  const b = await req('GET','/api/_diag_proxnum?t='+Date.now());
  let bJson = { raw:b };
  try{ bJson = JSON.parse(b.body||'{}'); }catch(e){ bJson.parseErr = e.message; bJson.body600 = (b.body||'').slice(0,600); }
  const res1 = bJson.res_por_resolver || {};
  save('_B_diag.json', {
    ok: bJson.ok,
    status: b.status,
    res_por_resolver: res1 ? {
      ok: res1.ok, proximo:res1.proximo, maior:res1.maior, qtd:res1.qtd, qtdNumeros:res1.qtdNumeros,
      incluiDeletadosNoMaximo:res1.incluiDeletadosNoMaximo, maxSql:res1.maxSql, sqlOk:res1.sqlOk, maiorScan:res1.maiorScan,
      top5: (res1.top15||[]).slice(0,5).map(x=>({n:x.n, numero:x.numero, of:x.of, of_num:x.of_num, criado:x.criado, deletado:x.deletado}))
    } : null
  });
  console.log('  B status='+b.status+' proximo='+JSON.stringify(res1?.proximo)+' maior='+JSON.stringify(res1?.maior)+' qtd='+JSON.stringify(res1?.qtd)+' incluiDeletados='+JSON.stringify(res1?.incluiDeletadosNoMaximo));

  console.log('(C) /api/ofs order_by=numero desc incluir_excluidas=0 limit=3...');
  const c = await req('GET','/api/ofs?limit=3&order_by=numero&order=desc&incluir_excluidas=0&nocache=1&t='+Date.now());
  let cJson = { raw:c };
  try{ cJson = JSON.parse(c.body||'{}'); }catch(e){ cJson.parseErr = e.message; cJson.body600=(c.body||'').slice(0,600); }
  const first3 = (cJson.data||cJson.ofs||[]).slice(0,3).map(o=>({n:o.numero||o.of, clinome:o.clinome, status:o.status, created:(o.created_at||'').slice(0,19), del:!!o.deleted_at}));
  save('_C_ofs_numero.json', {status:c.status, total:cJson.total, first3});
  console.log('  C status='+c.status+' total='+JSON.stringify(cJson.total)+' first: '+first3.map(x=>x.n).join(','));

  console.log('(D) /api/ofs cli_id RIPKE limit=1 incluir_excluidas=0...');
  const d = await req('GET','/api/ofs?cli_id=be617df1-441a-4f11-918e-d813a5ac854c&incluir_excluidas=0&limit=1&offset=0&nocache=1&t='+Date.now());
  let dJson = { raw:d };
  try{ dJson = JSON.parse(d.body||'{}'); }catch(e){ dJson.parseErr = e.message; }
  const firstOf = (dJson.data||dJson.ofs||[])[0];
  save('_D_ripke_total.json', {status:d.status, total:dJson.total, len:(dJson.data||dJson.ofs||[]).length, first: firstOf?{n:firstOf.numero||firstOf.of, clinome:firstOf.clinome, status:firstOf.status, del:!!firstOf.deleted_at}:null});
  console.log('  D status='+d.status+' total='+JSON.stringify(dJson.total));

  console.log('DONE probes saved to files.');
}
main().catch(e=>console.error('FATAL:', e.message));
