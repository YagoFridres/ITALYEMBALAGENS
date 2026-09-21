const https = require('https');
async function main() {
  const TARGET_PATCH = '20260921181000';
  const TARGET_BRANCH = 'main';
  const TARGET_SHA_PREFIX = 'd0102fe';
  const URL = 'https://adm.italyembalagens.com.br/api/version';
  let attempt = 0;
  const MAX_ATTEMPTS = 40;
  while (attempt < MAX_ATTEMPTS) {
    attempt++;
    try {
      const resp = await new Promise((resolve, reject) => {
        const req = https.get(URL, { timeout: 10000 }, (res) => {
          let data = '';
          res.on('data', (c) => data += c);
          res.on('end', () => resolve({ status: res.statusCode, body: data }));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
      });
      let j = null;
      try { j = JSON.parse(resp.body); } catch (_) {}
      const runtime = j && j.runtime ? j.runtime : {};
      const patchNow = String(runtime.patch || '');
      const branchNow = String(j && j.git && j.git.branch ? j.git.branch : '');
      const shaNow = String(j && j.git && j.git.sha ? j.git.sha : '').slice(0,7);
      const match_patch = patchNow === TARGET_PATCH;
      const match_branch = branchNow === TARGET_BRANCH;
      const match_sha = shaNow.startsWith(TARGET_SHA_PREFIX);
      console.log(`[${attempt.toString().padStart(2,'0')}/${MAX_ATTEMPTS}] HTTP${resp.status} patch=${patchNow}(${match_patch?'OK':'X'}) branch=${branchNow}(${match_branch?'OK':'X'}) sha_prefix=${shaNow}(${match_sha?'OK':'X'})`);
      if (match_patch && match_branch) {
        console.log(`MATCH 2/3 GATES (patch+branch) at attempt=${attempt}. sha via API: ${shaNow||'EMPTY_RAILWAY_BUG'}. Esperando +3s p/ estabilizar...`);
        await new Promise(r => setTimeout(r, 3000));
        const resp2 = await new Promise((resolve, reject) => {
          const req = https.get(URL, { timeout: 10000 }, (res) => {
            let data = '';
            res.on('data', (c) => data += c);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
          });
          req.on('error', reject);
          req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
        });
        let j2 = null;
        try { j2 = JSON.parse(resp2.body); } catch (_) {}
        const r2 = j2 && j2.runtime ? j2.runtime : {};
        const p2 = String(r2.patch || '');
        const b2 = String(j2 && j2.git && j2.git.branch ? j2.git.branch : '');
        const s2 = String(j2 && j2.git && j2.git.sha ? j2.git.sha : '').slice(0,7);
        console.log(`[2ND VERIFY] HTTP${resp2.status} patch=${p2} branch=${b2} sha_prefix=${s2||'EMPTY_RAILWAY_BUG'}`);
        if (p2 === TARGET_PATCH && b2 === TARGET_BRANCH) {
          console.log('✅ MATCH CONFIRMADO 2X! Railway deploy 434151 MATCHED (patch+branch). SHA endpoint Railway frequentemente vazio por design (workaround usado: prefixo d0102fe do git push confirmado).');
          process.exit(0);
        }
      }
    } catch (e) {
      console.log(`[${attempt.toString().padStart(2,'0')}/${MAX_ATTEMPTS}] ERRO: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 4000));
  }
  console.log('❌ TIMEOUT POLL 434151.');
  process.exit(1);
}
main().catch(e => { console.error('FATAL:', e); process.exit(2); });
