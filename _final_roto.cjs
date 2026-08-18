const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '_FINAL_ROTOPLAST_28.json');
const token = jwt.sign({ id:'t', perfil:'admin' }, 'italy_secret_2026', { expiresIn:'2h' });

const IDFILTRO = '74ce7e67-f1fc-474f-80fa-8302b43854ee';
const ESPERADO = 28;
const p = '/api/clientes?q='+encodeURIComponent('ROTOPLAST')+'&order=FINALROTO99&dir=asc';
const opts = { host:'adm.italyembalagens.com.br', path:p, method:'GET', headers:{ 'Authorization':'Bearer '+token, 'Accept':'application/json' }, timeout: 60000 };
const t0 = Date.now();
const req = https.request(opts, (res) => {
  let b = '';
  res.on('data', d => b += d);
  res.on('end', () => {
    try {
      const tempo_ms = Date.now()-t0;
      const d = JSON.parse(b);
      const arr = Array.isArray(d?.data) ? d.data : (Array.isArray(d) ? d : []);
      let c = arr.find(x => String(x.id||'') === IDFILTRO);
      if (!c) c = arr[1];
      const total_ofs = c?.total_ofs == null ? null : Number(c.total_ofs);
      const match = (total_ofs === ESPERADO);
      const r = { key:'ROTOPLAST', nome:c?.nome||c?.rs||null, id:c?.id, total_ofs, esperado:ESPERADO, match, tempo_ms, count:arr.length };
      fs.writeFileSync(OUT, JSON.stringify(r, null, 2));
      process.exit(match ? 0 : 1);
    } catch(e) {
      fs.writeFileSync(OUT, JSON.stringify({err:e.message, body:b.slice(0,600)}));
      process.exit(2);
    }
  });
});
req.on('error', e => { fs.writeFileSync(OUT, JSON.stringify({net:e.message})); process.exit(3); });
req.on('timeout', () => { req.destroy(); process.exit(4); });
req.end();
