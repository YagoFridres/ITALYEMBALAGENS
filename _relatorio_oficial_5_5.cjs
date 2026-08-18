const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const token = jwt.sign({ id:'t', perfil:'admin' }, 'italy_secret_2026', { expiresIn:'4h' });

const esperados = [
  { key:'RIPKE', q:'RIPKE', idFiltro:'be617df1-441a-4f11-918e-d813a5ac854c', esperado:422, seed:1001 },
  { key:'RUIZ', q:'RUIZ', idFiltro:'da2798c7-bf61-434f-bf3f-fbfd0877599d', esperado:275, seed:1002 },
  { key:'ROTOPLAST', q:'ROTOPLAST', idFiltro:'74ce7e67-f1fc-474f-80fa-8302b43854ee', esperado:28, seed:1003 },
  { key:'DKADI', q:'DKADI', idFiltro:'99c17e9d-336d-4e93-9b74-102433c95a17', esperado:23, seed:1004 },
  { key:'ITACIR', q:'ITACIR', idFiltro:'0bc5da45-16d1-4b18-aa79-14a0c2364f5d', esperado:14, seed:1005 },
];

const OUT_TXT = path.join(__dirname, '_RELATORIO_5_DE_5_VALIDACAO_P1.txt');
const OUT_JSON = path.join(__dirname, '_RELATORIO_5_DE_5_VALIDACAO_P1.json');
let linhas = [];
linhas.push('============================================================');
linhas.push('  RELATORIO OFICIAL - VALIDACAO PROMPT 1 (HOTFIX 2 c601dce)');
linhas.push('  5 CLIENTES ALVO x TOTAL_OFS NA LISTAGEM PRINCIPAL CARDS');
linhas.push('  Deploy Railway: v20260811204500');
linhas.push('  Data: ' + new Date().toISOString());
linhas.push('============================================================');
linhas.push('');

function consulta(esp) {
  return new Promise((resolve) => {
    const uriPath = '/api/clientes?q=' + encodeURIComponent(esp.q) + '&order=OFFICIALv1_' + esp.seed + '&dir=asc';
    const opts = {
      host:'adm.italyembalagens.com.br', path:uriPath, method:'GET',
      headers:{ 'Authorization':'Bearer '+token, 'Accept':'application/json' },
      timeout: 60000,
    };
    const t0 = Date.now();
    const req = https.request(opts, (res) => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => {
        try {
          const tempo_ms = Date.now()-t0;
          if (res.statusCode !== 200) {
            resolve({ ...esp, match:false, erro:'HTTP '+res.statusCode, tempo_ms });
            return;
          }
          const d = JSON.parse(b);
          const arr = Array.isArray(d?.data) ? d.data : (Array.isArray(d) ? d : []);
          let c = null;
          if (esp.idFiltro) c = arr.find(x => String(x?.id||'') === esp.idFiltro);
          if (!c) c = arr[0];
          const total_ofs = c?.total_ofs == null ? null : Number(c.total_ofs);
          const match = (total_ofs === esp.esperado);
          resolve({
            key:esp.key, id:esp.idFiltro,
            nome: c?.nome || c?.rs || '?',
            total_ofs_listagem: total_ofs, esperado: esp.esperado,
            match, tempo_ms, filtrados: arr.length,
          });
        } catch (e) {
          resolve({ ...esp, match:false, erro:'PARSE '+e.message, tempo_ms:Date.now()-t0 });
        }
      });
    });
    req.on('error', e => resolve({ ...esp, match:false, erro:'NET '+String(e?.message||e), tempo_ms:Date.now()-t0 }));
    req.on('timeout', () => { req.destroy(); resolve({ ...esp, match:false, erro:'TIMEOUT', tempo_ms:Date.now()-t0 }); });
    req.end();
  });
}

async function runOneByOne() {
  const results = [];
  for (const esp of esperados) {
    const r = await consulta(esp);
    results.push(r);
    const status = r.erro ? ('ERR ' + r.erro.slice(0, 18))
                  : (r.match ? '✅ PASSOU' : '❌ FALHOU');
    const linha = '  [' + r.key.padEnd(10) + '] ' +
                  String(r.nome||'?').padEnd(40).slice(0,40) + '  ' +
                  'total_ofs=' + String(r.total_ofs_listagem ?? 'NULL').padStart(4) + '  ' +
                  'esperado=' + String(r.esperado).padStart(4) + '  ' +
                  status + '  ' + (r.tempo_ms ?? 0) + 'ms';
    linhas.push(linha);
    fs.appendFileSync(OUT_TXT, linha + '\n');
  }
  const pass = results.filter(x => x.match && !x.erro).length;
  const todos = results.length;
  const ok = (pass === todos);
  linhas.push('');
  linhas.push('============================================================');
  linhas.push('  RESULTADO FINAL: ' + pass + ' / ' + todos + ' PASSARAM   ' + (ok ? 'SUCESSO 5/5 ✅✅✅✅✅' : 'FALHA'));
  linhas.push('============================================================');
  fs.writeFileSync(OUT_TXT, linhas.join('\n'));
  fs.writeFileSync(OUT_JSON, JSON.stringify({ ok, pass, total:todos, items:results }, null, 2));
  process.exit(ok ? 0 : 1);
}

fs.writeFileSync(OUT_TXT, linhas.join('\n') + '\n');
runOneByOne().catch(e => { fs.appendFileSync(OUT_TXT, '\n[FATAL] '+String(e?.message||e)+'\n'); process.exit(2); });
