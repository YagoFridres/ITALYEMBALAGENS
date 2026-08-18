// Poll Railway até deploy da versão 20260813040000 estar ativo
const https = require('https');
let tentativa = 0;
const MAX = 15;
function poll(){
  tentativa++;
  const opt = { hostname: 'italyembalagens-production.up.railway.app', method: 'GET', path: '/api/version', headers: { 'Cache-Control':'no-cache' }, timeout: 15000, rejectUnauthorized:false };
  const req = https.request(opt, (res) => {
    const patch = res.headers['x-index-patch-version'] || 'sem_header';
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => {
      let j = {};
      try { j = JSON.parse(body); } catch(e){}
      console.log(`[${String(tentativa).padStart(2,'0')}/${MAX}] status=${res.statusCode} x-patch=${patch}  runtime.patch=${j.runtime && j.runtime.patch}  commit=${j.git && j.git.commit && j.git.commit.substring(0,7)}`);
      if ((patch === '20260813040000' || (j.runtime && j.runtime.patch === '20260813040000')) && res.statusCode === 200) {
        console.log('✅ DEPLOY CONCLUIDO - versao 20260813040000 ativa');
        // Também testar 1 endpoint autenticado -> 401 token_missing (confirmar node nao crasha)
        const opt2 = { hostname: 'italyembalagens-production.up.railway.app', method:'GET', path:'/api/ofs?__nc='+Date.now(), timeout:15000, rejectUnauthorized:false };
        const req2 = https.request(opt2, (r2) => { console.log(`  → /api/ofs status=${r2.statusCode} (esperado 401)`); process.exit(0); });
        req2.on('error', (e)=>{ console.log('  → erro /api/ofs',e.message); process.exit(1); });
        req2.end();
        return;
      }
      if (tentativa >= MAX) { console.log('❌ TIMEOUT 15 polls sem deploy'); process.exit(1); }
      setTimeout(poll, 15000);
    });
  });
  req.on('error', (e) => { console.log(`[${tentativa}/${MAX}] ERRO REDE: ${e.message}`); if(tentativa>=MAX){process.exit(1);} setTimeout(poll, 15000); });
  req.setTimeout(15000, () => { req.destroy(new Error('timeout')); });
  req.end();
}
poll();
