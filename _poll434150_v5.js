const https = require('https');
const URL_API = 'https://adm.italyembalagens.com.br/api/version?_t=';

const target = {
  patch: '20260921171000',
  shaPrefix: 'b7d111a',
  branch: 'main'
};

async function fetchJsonOnce() {
  return new Promise((resolve, reject) => {
    const u = URL_API + Date.now();
    const req = https.get(u, { timeout: 10000 }, (res) => {
      let d = '';
      res.on('data', (c) => { d = d + c; });
      res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
  });
}

async function main() {
  const deadline = Date.now() + 600000;
  let tent = 0;
  console.log('POLL 434150: patch=' + target.patch + ' sha=' + target.shaPrefix);
  while (Date.now() < deadline) {
    tent++;
    try {
      const j = await fetchJsonOnce();
      const rp = String((j && j.runtime && j.runtime.patch) || '').trim();
      const sw = String((j && j.runtime && j.runtime.sw) || '').trim();
      const sh = String((j && j.git && j.git.sha) || '').trim();
      const br = String((j && j.git && j.git.branch) || '').trim();
      const pOk = rp === target.patch;
      const sOk = sh.startsWith(target.shaPrefix);
      const bOk = br === target.branch;
      console.log('T' + tent +
        ' patch=' + rp +
        ' sw=' + sw +
        ' sha=' + (sh ? sh.slice(0, 12) : '') +
        ' branch=' + br +
        ' | pOk=' + pOk + ' sOk=' + sOk + ' bOk=' + bOk);
      if (pOk && sOk && bOk) {
        console.log('\n✅ MATCHED 434150! patch=' + rp + ' sha=' + sh + ' branch=' + br);
        process.exit(0);
      }
    } catch (e) {
      console.log('T' + tent + ' ERRO: ' + String(e && e.message || e));
    }
    await new Promise(r => setTimeout(r, 5000));
  }
  console.log('TIMEOUT 434150');
  process.exit(1);
}
main();
