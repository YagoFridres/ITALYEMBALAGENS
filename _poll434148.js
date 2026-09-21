const https = require('https');
const BUMP = '20260921150000';
(async () => {
  for (let i = 1; i <= 36; i++) {
    const p = new Promise((resolve) => {
      const url = 'https://adm.italyembalagens.com.br/api/version?_t=' + Date.now();
      const req = https.get(url, { headers: { 'User-Agent': 'poll2-434148/1.0' } }, (res) => {
        let b = '';
        res.on('data', (c) => { b += c; });
        res.on('end', () => {
          try {
            const j = JSON.parse(b);
            resolve({
              status: res.statusCode,
              rt: j && j.runtime && j.runtime.patch,
              sha: j && j.git && j.git.commit,
              sw: j && j.runtime && j.runtime.sw,
            });
          } catch (e) { resolve({ err: e.message }); }
        });
      });
      req.on('error', (e) => resolve({ err: e.message }));
      req.end();
    });
    const r = await p;
    const matched = r.rt === BUMP;
    const sha7 = r.sha ? r.sha.substring(0, 7) : '?';
    console.log('[' + i + '] status=' + r.status + ' rt=' + r.rt + ' MATCH=' + matched + ' sha=' + sha7 + (r.err ? ' ERR=' + r.err : ''));
    if (matched) {
      console.log('\n✅ RAILWAY MATCHED runtime.patch=' + BUMP + ' sw=' + r.sw + ' (tentativa ' + i + ')');
      process.exit(0);
    }
    if (i >= 36) {
      console.log('\n❌ POLL TIMEOUT 180s (36 tentativas x 5s)');
      process.exit(2);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
})();
