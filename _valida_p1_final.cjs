const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const secret = 'italy_secret_2026';
const token = jwt.sign({ id:'t', perfil:'admin' }, secret, { expiresIn:'2h' });

const queries = [
  { key:'RIPKE',     q:'RIPKE',     esperado:422, nomeContem:'RIPKE' },
  { key:'RUIZ',      q:'RUIZ',      esperado:275, nomeContem:'RUIZ' },
  { key:'ROTOPLAST', q:'ROTOPLAST', esperado:28,  nomeContem:'ROTOPLAST' },
  { key:'DKADI',     q:'DKADI',     esperado:23,  nomeContem:'DKADI' },
  { key:'ITACIR',    q:'ITACIR',    esperado:14,  nomeContem:'ITACIR' },
];

function get(q, orderSeed) {
  return new Promise((resolve) => {
    const path = '/api/clientes?q=' + encodeURIComponent(q) +
      '&order=nome_' + String(orderSeed) + '&dir=asc';
    const opts = {
      host:'adm.italyembalagens.com.br', path, method:'GET',
      headers:{ 'Authorization':'Bearer '+token, 'Accept':'application/json' },
      timeout: 120000,
    };
    const t0 = Date.now();
    const req = https.request(opts, (res) => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => {
        const elapsed = Date.now()-t0;
        try {
          if (res.statusCode !== 200) {
            resolve({ q, error: 'HTTP '+res.statusCode, status: res.statusCode, body: b.slice(0,400), tempo_ms: elapsed });
            return;
          }
          const d = JSON.parse(b);
          const arr = Array.isArray(d?.data) ? d.data : (Array.isArray(d) ? d : []);
          const c = arr.find(x => String(x?.nome||x?.rs||x?.razao_social||'').toUpperCase().includes(q.toUpperCase()));
          resolve({
            q,
            status: res.statusCode,
            total_filtrado: arr.length,
            found: !!c,
            id: c?.id || null,
            nome: c?.nome || c?.rs || null,
            total_ofs: c?.total_ofs == null ? null : Number(c.total_ofs),
            tempo_ms: elapsed,
          });
        } catch(e) {
          resolve({ q, status: res.statusCode, parseErr: e.message, body: b.slice(0,500), tempo_ms: elapsed });
        }
      });
    });
    req.on('timeout', () => { req.destroy(new Error('timeout 120s')); });
    req.on('error', e => resolve({ q, netErr: String(e?.message||e), tempo_ms: Date.now()-t0 }));
    req.end();
  });
}

async function main(){
  const results = [];
  let seed = 1;
  for (const t of queries) {
    // CacheKey diferente para cada chamada (order=nome_X != order=nome_Y), 0 risco de cache antigo com 0.
    const r = await get(t.q, seed++);
    const esperado = t.esperado;
    const match = (r.total_ofs === esperado);
    const linha = {
      key: t.key,
      q: t.q,
      found: r.found,
      status_http: r.status,
      nome: r.nome,
      id: r.id,
      total_ofs_listagem: r.total_ofs,
      esperado,
      match,
      total_filtrado: r.total_filtrado,
      tempo_ms: r.tempo_ms,
      erro: r.error || r.netErr || r.parseErr || null,
    };
    results.push(linha);
    console.log('[TESTE]', t.key.padEnd(10), '|',
      (r.error||r.netErr||r.parseErr) ? ('ERR: '+(r.error||r.netErr||r.parseErr)).padEnd(30)
      : ((r.total_ofs==null?'NULL':r.total_ofs)+' vs '+esperado+'  '+(match?'✅':'❌')).padEnd(30),
      '|', r.tempo_ms+'ms', '|', (r.nome||'').slice(0,30));
  }
  const todosPassaram = results.every(r => r.match && !r.erro);
  const final = { todos_passaram: todosPassaram, resultados: results };
  const out = path.join(__dirname, '_valida_p1_hotfix2.json');
  fs.writeFileSync(out, JSON.stringify(final, null, 2));
  console.log('\n=== FINAL ===');
  console.log('todos_passaram =', todosPassaram);
  console.log('JSON salvo em:', out);
  process.exit(todosPassaram ? 0 : 1);
}
main().catch(e => { console.error('[FATAL]', e?.message || e); process.exit(2); });
