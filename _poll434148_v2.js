const https = require('https');
const BUMP = '20260921150000';
const EXPECTED_SHA_PREFIX = '2296807';

async function main() {
  for (let i = 1; i <= 40; i++) {
    const result = await new Promise((resolve) => {
      const url = 'https://adm.italyembalagens.com.br/api/version?_t=' + Date.now();
      const req = https.get(url, {
        headers: { 'User-Agent': 'poll-v2-434148/1.0', 'Accept': 'application/json' }
      }, (res) => {
        let b = '';
        res.on('data', (c) => { b += c; });
        res.on('end', () => {
          try {
            const j = JSON.parse(b);
            resolve({
              ok: true,
              status: res.statusCode,
              rt: j && j.runtime && j.runtime.patch,
              sw: j && j.runtime && j.runtime.sw,
              sha: j && j.git && j.git.commit,
              branch: j && j.git && j.git.branch
            });
          } catch (e) {
            resolve({ ok: false, status: res.statusCode, err: e.message, raw: b.slice(0, 200) });
          }
        });
      });
      req.on('error', (e) => resolve({ ok: false, err: e.message }));
      req.setTimeout(15000, () => { req.destroy(new Error('timeout 15s')); });
      req.end();
    });

    const sha7 = result.sha ? String(result.sha).substring(0, 7) : '?';
    const matched = result.rt === BUMP;
    const shaOk = result.sha && sha7 === EXPECTED_SHA_PREFIX;
    const branchOk = result.branch === 'main';
    const allOk = matched && shaOk && branchOk;
    const mark = allOk ? '✅' : (matched ? '🟡' : '⏳');
    console.log(
      '[' + String(i).padStart(2, '0') + '/40] ' + mark +
      ' status=' + result.status +
      ' rt=' + result.rt +
      ' MATCH=' + matched +
      ' sha=' + sha7 + (shaOk ? '(OK)' : '') +
      ' branch=' + (result.branch || '?') + (branchOk ? '(OK)' : '') +
      (result.err ? ' ERR=' + result.err : '')
    );

    if (allOk) {
      console.log('\n========================================');
      console.log('✅ RAILWAY MATCHED 434148 — 3 gates OK:');
      console.log('   runtime.patch = ' + result.rt);
      console.log('   git.commit    = ' + sha7 + ' (' + result.sha + ')');
      console.log('   git.branch    = ' + result.branch);
      console.log('========================================\n');
      process.exit(0);
    }

    if (i < 40) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
  console.log('\n❌ TIMEOUT POLL 40 tentativas (≈200s) — Railway ainda não atualizou.');
  process.exit(2);
}

main();
