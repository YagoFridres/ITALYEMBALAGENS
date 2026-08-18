const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const secret = 'italy_secret_2026';
const token = jwt.sign({ id:'t', perfil:'admin' }, secret, { expiresIn:'2h' });
const OUT_FILE = path.join(__dirname, '_teste_ripke_step.txt');
const log = (s) => { fs.appendFileSync(OUT_FILE, String(s)+'\n'); console.log(String(s)); };
fs.writeFileSync(OUT_FILE, '=== TESTE RIPKE PASSO A PASSO ===\n');
log('1. Token gerado, JWT valido: '+(token.length>10?'SIM':'NAO'));
log('2. Iniciando requisicao HTTPS...');
const p = '/api/clientes?q='+encodeURIComponent('RIPKE')+'&order=teste123&dir=asc';
const opts = {
  host:'adm.italyembalagens.com.br', path:p, method:'GET',
  headers:{ 'Authorization':'Bearer '+token, 'Accept':'application/json' },
  timeout: 30000,
};
const t0 = Date.now();
const req = https.request(opts, (res) => {
  log('3. Resposta recebida! status='+res.statusCode);
  let b = '';
  let chunks = 0;
  res.on('data', d => { b += d; chunks++; });
  res.on('end', () => {
    log('4. Body completo! chunks='+chunks+' len='+b.length+' tempo_ms='+(Date.now()-t0));
    try {
      const d = JSON.parse(b);
      const arr = Array.isArray(d?.data) ? d.data : (Array.isArray(d) ? d : []);
      log('5. Parse OK! array_length='+arr.length);
      if (arr.length>0) {
        const c = arr[0];
        log('6. Cliente[0]: nome='+(c?.nome||c?.rs||'?')+' total_ofs='+c?.total_ofs+' id='+String(c?.id||'?').slice(0,8));
        const match = Number(c?.total_ofs) === 422;
        log('7. RESULTADO RIPKE: total_ofs='+c?.total_ofs+' esperado=422 => '+(match?'PASSOU ✅':'FALHOU ❌'));
      }
      const outj = path.join(__dirname,'_teste_ripke_body.json');
      fs.writeFileSync(outj, JSON.stringify(Array.isArray(d?.data)?d.data:d, null, 2).slice(0,20000));
      log('8. Body salvo em: '+outj);
      process.exit(0);
    } catch(e) {
      log('ERR PARSE: '+e.message+' | body_prefix='+b.slice(0,200));
      process.exit(3);
    }
  });
});
req.on('timeout', () => { log('ERR TIMEOUT 30s'); req.destroy(new Error('to')); process.exit(4); });
req.on('error', e => { log('ERR NET: '+String(e?.message||e)); process.exit(5); });
req.setTimeout(30000, () => { log('ERR SETTIMEOUT'); req.destroy(); process.exit(6); });
req.end();
log('2.5. Requisicao enviada (req.end chamado), aguardando...');
setTimeout(()=>{log('KEEPALIVE 5s...');}, 5000);
setTimeout(()=>{log('KEEPALIVE 10s...');}, 10000);
setTimeout(()=>{log('KEEPALIVE 15s...');}, 15000);
