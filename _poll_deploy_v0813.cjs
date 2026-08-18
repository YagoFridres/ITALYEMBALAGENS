const https = require('https');
const BASE = 'https://adm.italyembalagens.com.br/api/version';
const EXPECT_PATCH = '20260813081300';
const EXPECT_COMMIT_PREFIX = '4745406';
const TIMEOUT_MS = 120000;
const POLL_MS = 8000;

function get() {
  return new Promise((resolve, reject) => {
    const req = https.get(BASE, { timeout: 15000 }, (res) => {
      let buf = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { buf += c; });
      res.on('end', () => {
        try {
          const j = JSON.parse(buf);
          resolve(j);
        } catch (e) { reject(new Error('bad_json: ' + buf.slice(0, 200))); }
      });
    });
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
    req.on('error', (e) => reject(e));
  });
}

(async () => {
  const start = Date.now();
  let last = null;
  while (Date.now() - start < TIMEOUT_MS) {
    try {
      const r = await get();
      const patch = String((r && r.runtime && r.runtime.patch) || '');
      const commit = String((r && r.git && r.git.commit) || '').slice(0, 7);
      last = { patch, commit };
      const now = new Date().toISOString().slice(11, 19);
      console.log('[' + now + '] patch=' + patch + ' commit=' + commit);
      if (patch === EXPECT_PATCH && commit.startsWith(EXPECT_COMMIT_PREFIX)) {
        console.log('');
        console.log('DEPLOY_OK patch=' + EXPECT_PATCH + ' commit=' + EXPECT_COMMIT_PREFIX);
        process.exit(0);
      }
    } catch (e) {
      const now = new Date().toISOString().slice(11, 19);
      console.log('[' + now + '] ERR: ' + String(e.message || e).slice(0, 160));
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  console.log('');
  console.log('DEPLOY_TIMEOUT ultimo=' + JSON.stringify(last));
  process.exit(1);
})();
