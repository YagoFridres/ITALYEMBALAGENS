const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const secret = 'italy_secret_2026';
const token = jwt.sign({ id:'t', perfil:'admin' }, secret, { expiresIn:'2h' });

const queries = [
  { key:'RIPKE',     q:'RIPKE',     esperado:422, pickRule: (arr, q) => arr.find(x => String(x?.nome||x?.rs||x?.razao_social||'').toUpperCase().includes(q.toUpperCase())) },
  { key:'RUIZ',      q:'RUIZ',      esperado:275, pickRule: (arr, q) => arr.find(x => String(x?.nome||x?.rs||x?.razao_social||'').toUpperCase().includes(q.toUpperCase())) },
  { key:'ROTOPLAST', q:'ROTOPLAST', esperado:28,  pickRule: (arr) => {
      const porId = arr.find(x => String(x?.id||'') === '74ce7e67-f1fc-474f-80fa-8302b43854ee');
      if (porId) return porId;
      return arr.find(x => /ROTOPLAST\s+IND/i.test(String(x?.nome||x?.rs||'')));
    } },
  { key:'DKADI',     q:'DKADI',     esperado:23,  pickRule: (arr, q) => arr.find(x => String(x?.nome||x?.rs||x?.razao_social||'').toUpperCase().includes(q.toUpperCase())) },
  { key:'ITACIR',    q:'ITACIR',    esperado:14,  pickRule: (arr, q) => arr.find(x => String(x?.nome||x?.rs||x?.razao_social||'').toUpperCase().includes(q.toUpperCase())) },
];

function get(q, orderSeed) {
  return new Promise((resolve) => {
    const path = '/api/clientes?q=' + encodeURIComponent(q) +
      '&order=validap1_' + String(orderSeed) + '&dir=asc';
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
          resolve({ q, status: res.statusCode, total_filtrado: arr.length, arr, tempo_ms: elapsed });
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
    const r = await get(t.q, seed++);
    if (r.error || r.netErr || r.parseErr) {
      results.push({ key:t.key, erro: r.error||r.netErr||r.parseErr, match:false });
      console.log('[TESTE]', t.key.padEnd(10), '|', ('ERR: '+(r.error||r.netErr||r.parseErr)).padEnd(35), '|', r.tempo_ms+'ms');
      continue;
    }
    const c = t.pickRule(r.arr, t.q);
    const esperado = t.esperado;
    const total_ofs = c?.total_ofs == null ? null : Number(c.total_ofs);
    const match = (total_ofs === esperado);
    const linha = {
      key: t.key, q: t.q, found: !!c, status_http: r.status,
      nome: c?.nome || c?.rs || null, id: c?.id || null,
      total_ofs_listagem: total_ofs, esperado, match,
      total_filtrado: r.total_filtrado, tempo_ms: r.tempo_ms, erro: null,
    };
    results.push(linha);
    console.log('[TESTE]', t.key.padEnd(10), '|',
      ((total_ofs==null?'NULL':total_ofs)+' vs '+esperado+'  '+(match?'✅':'❌')).padEnd(35),
      '|', String(r.tempo_ms).padStart(4)+'ms', '|', (c?.nome||'NÃO ENCONTRADO').slice(0,30));
  }
  const todosPassaram = results.every(r => r.match && !r.erro);
  const final = { todos_passaram: todosPassaram, resultados: results };
  const out = path.join(__dirname, '_valida_p1_hotfix2_v2.json');
  fs.writeFileSync(out, JSON.stringify(final, null, 2));
  console.log('\n=== FINAL ===');
  const passados = results.filter(r=>r.match).length;
  const total = results.length;
  console.log('PASSARAM:', passados, '/', total, (todosPassaram?'✅':'❌'));
  console.log('todos_passaram =', todosPassaram);
  console.log('JSON salvo em:', out);
  process.exit(todosPassaram ? 0 : 1);
}
main().catch(e => { console.error('[FATAL]', e?.message || e); process.exit(2); });
