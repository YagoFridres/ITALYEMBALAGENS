const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const secret = 'italy_secret_2026';
const token = jwt.sign({ id:'test-cli-0001', perfil:'admin', email:'test@italy.com' }, secret, { expiresIn:'1h' });

const queries = [
  { key:'RIPKE', q:'RIPKE', esperado:422 },
  { key:'RUIZ', q:'RUIZ', esperado:275 },
  { key:'ROTOPLAST', q:'ROTOPLAST', esperado:28 },
  { key:'DKADI', q:'DKADI', esperado:23 },
  { key:'ITACIR', q:'ITACIR', esperado:14 },
];
const HOST = 'https://adm.italyembalagens.com.br';
const headers = { 'Authorization':'Bearer '+token, 'Content-Type':'application/json' };

async function runOne(q) {
  const url = HOST + '/api/clientes?q=' + encodeURIComponent(q.q);
  const t0 = Date.now();
  try {
    const r = await fetch(url, { headers });
    if (!r.ok) {
      let body = '';
      try { body = await r.text(); } catch(_){}
      return { key:q.key, q:q.q, esperado:q.esperado, error:'HTTP '+r.status, response: body.slice(0,300), tempo_ms:Date.now()-t0 };
    }
    const data = await r.json();
    const arr = Array.isArray(data)?data:(Array.isArray(data?.data)?data.data:(Array.isArray(data?.clientes)?data.clientes:[]));
    const c = arr.find(x => String(x?.nome||x?.razao_social||x?.rs||'').toUpperCase().includes(q.q.toUpperCase()));
    const total_ofs = c?.total_ofs == null ? null : Number(c.total_ofs);
    return { key:q.key, q:q.q, nome:c?.nome||null, id:c?.id||null, total_ofs, esperado:q.esperado, match: total_ofs===q.esperado, total_clientes_filtrados:arr.length, tempo_ms:Date.now()-t0 };
  } catch(e) {
    return { key:q.key, q:q.q, esperado:q.esperado, error:String(e?.message||e), tempo_ms:Date.now()-t0 };
  }
}

async function main(){
  const results = [];
  for (const q of queries) {
    const r = await runOne(q);
    results.push(r);
    const st = r.error ? ('ERRO: '+r.error) : (r.match ? 'OK' : 'MISMATCH (total='+r.total_ofs+' esperado='+r.esperado+')');
    console.log('[PROGRESS]', q.key, st, r.tempo_ms+'ms');
  }
  const final = { todos_passaram: results.every(r=>r.match), resultados: results };
  const txt = JSON.stringify(final, null, 2);
  const outPath = path.join(__dirname, '_tmp_out_final.json');
  fs.writeFileSync(outPath, txt, 'utf8');
  console.log('\n=== RESULTADO FINAL ===');
  console.log('todos_passaram =', final.todos_passaram);
  console.log('Arquivo salvo em:', outPath);
}
main().catch(e=>{ console.error('[FATAL]', e?.message||e); process.exit(1); });
