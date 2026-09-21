const https = require('https');
const URL = 'https://adm.italyembalagens.com.br/api/version';
const TARGET_PATCH = '20260921191000';
const TARGET_BRANCH = 'main';
const TARGET_SHA_PREFIX = '1643f53';

function poll() {
  return new Promise((resolve, reject) => {
    const req = https.get(URL, { headers: { 'User-Agent': 'poll-434152' } }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          const patchOK = j && String(j.runtime && j.runtime.patch || '') === TARGET_PATCH;
          const branchOK = j && String(j.git && j.git.branch || '') === TARGET_BRANCH;
          const shaRaw = String((j.git && (j.git.commit_raw || j.git.sha || '')) || '');
          const shaOK = shaRaw.indexOf(TARGET_SHA_PREFIX) === 0;
          const shaPrefixDisplay = shaRaw.slice(0, 7);
          console.log(`[${new Date().toISOString()}] status=${res.statusCode} patch=${j && j.runtime && j.runtime.patch} branch=${j && j.git && j.git.branch} sha_prefix=${shaPrefixDisplay} commit_raw=${shaRaw} patchOK=${patchOK} branchOK=${branchOK} shaOK=${shaOK}`);
          resolve({ patchOK, branchOK, shaOK, allOK: patchOK && branchOK && shaOK });
        } catch (e) {
          console.log('parse_error', e.message, 'data=', data.slice(0, 200));
          resolve({ allOK: false });
        }
      });
    });
    req.on('error', (e) => { console.log('net_error', e.message); resolve({ allOK: false }); });
    req.setTimeout(10000, () => { req.destroy(); resolve({ allOK: false }); });
  });
}

(async () => {
  let attempts = 0;
  const MAX = 60;
  let lastAllOK = false;
  while (attempts < MAX) {
    attempts++;
    try {
      const r = await poll();
      if (r.allOK) {
        console.log(`\n✅ MATCHED 3/3 gates (patch+branch+shaPrefix) em ${attempts} tentativas.`);
        process.exit(0);
      }
      lastAllOK = r.allOK;
    } catch (_) { }
    await new Promise(r => setTimeout(r, 4000));
  }
  console.log('\n⚠ TIMEOUT após ' + attempts + ' tentativas. lastAllOK=' + lastAllOK + '. Verificar manual / Railway build log.');
  process.exit(1);
})();
