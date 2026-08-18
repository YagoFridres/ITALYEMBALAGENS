const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const token = jwt.sign({ id:'t', perfil:'admin' }, 'italy_secret_2026', { expiresIn:'2h' });
const OUT = path.join(__dirname, '_dump_rotoplast.json');
const p = '/api/clientes?q='+encodeURIComponent('ROTOPLAST')+'&order=DUMPROTO3&dir=asc';
const opts = { host:'adm.italyembalagens.com.br', path:p, method:'GET', headers:{ 'Authorization':'Bearer '+token, 'Accept':'application/json' }, timeout: 60000 };
const req = https.request(opts, (res) => {
  let b = '';
  res.on('data', d => b += d);
  res.on('end', () => {
    try {
      const d = JSON.parse(b);
      const arr = Array.isArray(d?.data) ? d.data : (Array.isArray(d) ? d : []);
      const dump = arr.map(x => ({ id: x.id, nome: x.nome || x.rs, total_ofs: x.total_ofs }));
      fs.writeFileSync(OUT, JSON.stringify({ statusCode: res.statusCode, count: arr.length, items: dump },null,2));
      console.log('DUMP OK count=', arr.length);
      console.log(JSON.stringify(dump, null, 2));
      process.exit(0);
    } catch(e) { fs.writeFileSync(OUT, JSON.stringify({err:e.message,body:b.slice(0,500)})); process.exit(1); }
  });
});
req.on('error', e => { fs.writeFileSync(OUT, JSON.stringify({net:e.message})); process.exit(2); });
req.on('timeout', () => { req.destroy(); process.exit(3); });
req.end();
