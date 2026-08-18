const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const KEY = process.argv[2] || 'RIPKE';
const QS  = process.argv[3] || 'RIPKE';
let IDFILTRO = process.argv[4] || '';
if (IDFILTRO === 'NONE') IDFILTRO = '';
const ESPERADO = parseInt(process.argv[5] || '0', 10);
const SEED = process.argv[6] || '1';

const OUT = path.join(__dirname, '_r_'+KEY+'.json');
const token = jwt.sign({ id:'t', perfil:'admin' }, 'italy_secret_2026', { expiresIn:'2h' });

const writeOut = (obj) => { try { fs.writeFileSync(OUT, JSON.stringify(obj,null,2)); } catch(e){} };
writeOut({ status:'iniciando', key:KEY, q:QS, esperado:ESPERADO, ts:Date.now() });

const uriPath = '/api/clientes?q=' + encodeURIComponent(QS) + '&order=unico_'+SEED+'_'+KEY+'&dir=asc';
const opts = {
  host:'adm.italyembalagens.com.br', path:uriPath, method:'GET',
  headers:{ 'Authorization':'Bearer '+token, 'Accept':'application/json' },
  timeout: 45000,
};
const t0 = Date.now();
const req = https.request(opts, (res) => {
  let b = '';
  res.on('data', d => { b += d; });
  res.on('end', () => {
    const tempo_ms = Date.now()-t0;
    try {
      writeOut({ status:'resposta', key:KEY, statusCode:res.statusCode, bodyLen:b.length, tempo_ms, ts:Date.now() });
      if (res.statusCode !== 200) {
        const r = { key:KEY, match:false, erro:'HTTP '+res.statusCode, body:b.slice(0,200), tempo_ms };
        writeOut(r); process.exit(2);
      }
      const d = JSON.parse(b);
      const arr = Array.isArray(d?.data) ? d.data : (Array.isArray(d) ? d : []);
      let c = null;
      if (IDFILTRO) {
        for (const x of arr) { if (String(x?.id||'') === IDFILTRO) { c = x; break; } }
      }
      if (!c) {
        for (const x of arr) {
          const n = String(x?.nome||x?.rs||x?.razao_social||'').toUpperCase();
          if (n.includes(QS.toUpperCase())) { c = x; break; }
        }
      }
      if (!c && arr.length>0) c = arr[0];
      const total_ofs = c?.total_ofs == null ? null : Number(c.total_ofs);
      const match = (total_ofs === ESPERADO);
      const r = {
        key:KEY, found:!!c, status_http:res.statusCode,
        nome: c?.nome || c?.rs || null,
        id: c?.id || null,
        total_ofs, esperado:ESPERADO, match,
        total_filtrado: arr.length, tempo_ms
      };
      writeOut(r);
      process.exit(match ? 0 : 1);
    } catch(e) {
      writeOut({ key:KEY, match:false, erro:'PARSE: '+e.message, body:b.slice(0,300), tempo_ms:Date.now()-t0 });
      process.exit(3);
    }
  });
});
req.on('timeout', () => { writeOut({ key:KEY, match:false, erro:'TIMEOUT 45s', tempo_ms:Date.now()-t0 }); req.destroy(); process.exit(4); });
req.on('error', (e) => { writeOut({ key:KEY, match:false, erro:'NET: '+String(e?.message||e), tempo_ms:Date.now()-t0 }); process.exit(5); });
req.end();
