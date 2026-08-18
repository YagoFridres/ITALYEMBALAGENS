const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');
const T = '20260812215000';
const OUT_LOG = '_POLL_V19.log';
const end = Date.now() + 50 * 60 * 1000;
let i = 0;
fs.writeFileSync(OUT_LOG, '');
function L(s) { fs.appendFileSync(OUT_LOG, s + '\n'); console.log(s); }
function R(p) {
  return new Promise(res => {
    https.get({
      hostname: 'adm.italyembalagens.com.br', port: 443,
      path: p + '?__nc=' + Date.now(),
      headers: { 'Accept-Encoding': 'identity', 'Cache-Control': 'no-cache' }
    }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => res(d.includes(T))); })
      .on('error', () => res(false));
  });
}
(async () => {
  while (Date.now() < end) {
    i++;
    const a = await R('/sw.js');
    const b = await R('/index.html');
    const c = await R('/patch.js');
    const ok = a && b && c;
    L(`i=${i} OK=${ok} sw=${a} ix=${b} pt=${c}`);
    if (ok) {
      // prepara V19
      let txt = fs.readFileSync('_v18_final.cjs', 'utf8');
      txt = txt.replace(/20260812211000/g, '20260812215000').replace(/_V18_FINAL/g, '_V19_FINAL');
      fs.writeFileSync('_v19_final.cjs', txt);
      L('--- START V19 ---');
      try { execSync('node _v19_final.cjs', { stdio: 'inherit' }); } catch (e) { L('V19_ERR ' + (e.message || e)); }
      process.exit(0);
    }
    await new Promise(r => setTimeout(r, 7000));
  }
  L('TIMEOUT_POLL');
  process.exit(5);
})();
