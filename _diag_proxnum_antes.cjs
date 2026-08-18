const https = require('https');
const TOK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRpYWctbG9jYWwtcHJvYmUtMDAwMSIsIm5vbWUiOiJEaWFnIExvY2FsIFByb2JlIiwiZW1haWwiOiJkaWFnQGxvY2FsIiwicGVyZmlsIjoiYWRtaW4iLCJwZXJtaXNzb2VzIjpbInR1ZG8iXSwiYXZhdGFyX3VybCI6bnVsbCwiaWF0IjoxNzg2NjIwNjQ3LCJleHAiOjE3ODY2NDIyNDd9.vZAQV_znvnWr6L0bZf6C17TDw6n3kYX1hfMS-6Sz6z0';
const URL1 = 'https://adm.italyembalagens.com.br/api/ofs/proximo-numero';
const URL2 = 'https://adm.italyembalagens.com.br/api/_diag_proxnum';
const URL3 = 'https://adm.italyembalagens.com.br/api/ofs?limit=1&order_by=numero&order=desc&incluir_excluidas=1&t=' + Date.now();

function req(url){
  return new Promise(res=>{
    const u = new URL(url);
    const opts = {
      method: 'GET', hostname: u.hostname, port: 443, path: u.pathname + u.search,
      timeout: 15000, headers: { 'Authorization': 'Bearer ' + TOK, 'Accept':'application/json','User-Agent':'node-diag/1.0' }
    };
    const rq = https.request(opts, r=>{
      let d=''; r.on('data',c=>d+=c); r.on('end', ()=>res({status:r.statusCode, body:d}));
    });
    rq.on('error', e=>res({err:e.message}));
    rq.on('timeout', ()=>{ rq.destroy(new Error('timeout')); });
    rq.end();
  });
}
(async()=>{
  const [r1,r2,r3] = await Promise.all([req(URL1), req(URL2), req(URL3)]);
  console.log('=== (1) /api/ofs/proximo-numero ===');
  console.log('HTTP=', r1.status); try{ console.log(JSON.stringify(JSON.parse(r1.body), null, 2)); }catch(e){ console.log(r1.body.slice(0,500)); }
  console.log('\n=== (2) /api/_diag_proxnum ===');
  console.log('HTTP=', r2.status); try{ const j = JSON.parse(r2.body); const s = JSON.stringify({
    ok: j.ok, emp_por_resolver: j.emp_por_resolver, emp_por_ctx: j.emp_por_ctx, iguais: j.iguais,
    res_por_resolver: { ok:j.res_por_resolver?.ok, proximo:j.res_por_resolver?.proximo, maior:j.res_por_resolver?.maior, qtd:j.res_por_resolver?.qtd, qtdNumeros:j.res_por_resolver?.qtdNumeros, numeracaoGlobal:j.res_por_resolver?.numeracaoGlobal, incluiDeletadosNoMaximo:j.res_por_resolver?.incluiDeletadosNoMaximo, maxSql:j.res_por_resolver?.maxSql, sqlOk:j.res_por_resolver?.sqlOk, maiorScan:j.res_por_resolver?.maiorScan, top15: (j.res_por_resolver?.top15||[]).map(x=>({n:x.n, numero:x.numero, of:x.of, ofn:x.of_num, criado:x.criado, deletado:x.deletado})) },
    res_por_ctx: { ok:j.res_por_ctx?.ok, proximo:j.res_por_ctx?.proximo, maior:j.res_por_ctx?.maior, incluiDeletadosNoMaximo:j.res_por_ctx?.incluiDeletadosNoMaximo, maxSql:j.res_por_ctx?.maxSql, maiorScan:j.res_por_ctx?.maiorScan, top15:(j.res_por_ctx?.top15||[]).map(x=>({n:x.n, deletado:x.deletado})) }
  }, null, 2); console.log(s); }catch(e){ console.log('PARSE_ERR:', e.message); console.log(r2.body.slice(0,1000)); }
  console.log('\n=== (3) /api/ofs?limit=1&order=numero desc (ROTA FRONTEND ABRIR NOVA OF RAPIDA) ===');
  console.log('HTTP=', r3.status); try{ const j = JSON.parse(r3.body); const first = (j.data||j.ofs||[])[0]; console.log(JSON.stringify({total:j.total, len:(j.data||j.ofs||[]).length, primeiro: first?{id:first.id, numero:first.numero, of:first.of, of_num:first.of_num, clinome:first.clinome, deleted_at:first.deleted_at, created_at:first.created_at?.slice(0,19)}:null}, null, 2)); }catch(e){ console.log('PARSE_ERR:', e.message); console.log(r3.body.slice(0,800)); }
})();
