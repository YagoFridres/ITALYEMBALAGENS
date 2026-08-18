const https = require('https');
const T_MAX_MS = 5 * 60 * 1000; // 5 min
const T0 = Date.now();
let t = 0;
function safe(s, n=120){ try{ return (s||'').toString().substring(0,n); }catch(e){ return String(s||'').substring(0,n); } }
function poll(){
  t++;
  const opt = { hostname:'italyembalagens-production.up.railway.app', method:'GET', path:'/api/version?__nc='+Date.now(), headers:{'Cache-Control':'no-cache','User-Agent':'poll-node'}, timeout:15000, rejectUnauthorized:false };
  const req = https.request(opt, (res) => {
    let body=''; res.on('data', c => body+=c); res.on('end', () => {
      let j={}; try{ j=JSON.parse(body); }catch(e){ j={raw:body}; }
      const patch = (res.headers['x-index-patch-version']||res.headers['X-Index-Patch-Version']||'n/a').toString();
      const rp = ((j.runtime||{}).patch||'n/a').toString();
      const gc = ((j.git||{}).commit||'').toString().substring(0,7)||'n/a';
      const elapsed = Math.round((Date.now()-T0)/1000);
      console.log(`[${String(t).padStart(2,'0')} +${elapsed}s] HTTP ${res.statusCode}  x-patch=${patch}  runtime.patch=${rp}  commit=${gc}  body=${safe(body,80)}`);
      if ((rp === '20260813040000' || patch === '20260813040000') && res.statusCode === 200) {
        console.log('\n✅ DEPLOY ATIVO!');
        // Testar /api/clientes?lite=1 também
        const o2 = { hostname:'italyembalagens-production.up.railway.app', method:'GET', path:'/api/clientes?lite=1&__nc='+Date.now(), timeout:15000, rejectUnauthorized:false };
        const r2 = https.request(o2, (rr) => { console.log(`  → /api/clientes?lite=1 HTTP ${rr.statusCode}`); process.exit(0); });
        r2.on('error', e => { console.log('  → err',e.message); process.exit(1); }); r2.end();
        return;
      }
      if (Date.now()-T0 > T_MAX_MS) { console.log('\n❌ TIMEOUT 5min'); process.exit(1); }
      setTimeout(poll, 8000);
    });
  });
  req.on('error', (e) => {
    console.log(`[${t} +${Math.round((Date.now()-T0)/1000)}s] REDE_ERR: ${safe(e.message,80)}`);
    if (Date.now()-T0 > T_MAX_MS) process.exit(1);
    setTimeout(poll, 8000);
  });
  req.setTimeout(15000, () => req.destroy(new Error('timeout')));
  req.end();
}
console.log('Poll Railway deploy BUG1 v=20260813040000... (max 5min)');
poll();
