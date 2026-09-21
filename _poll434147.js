const https = require('https');
const TARGET = '20260918434147';
const URL = 'https://adm.italyembalagens.com.br/api/version';
let attempt = 0;
const MAX_ATTEMPTS = 60;
function poll() {
  attempt += 1;
  const req = https.get(URL, { timeout: 10000 }, (res) => {
    let d = '';
    res.on('data', (c) => { d += c; });
    res.on('end', () => {
      try {
        const j = JSON.parse(d);
        const patch = String(j && j.runtime && j.runtime.patch || '');
        console.log('[poll434147] attempt=' + attempt + ' status=' + res.statusCode + ' runtime.patch=' + patch + ' MATCHED=' + (patch === TARGET ? 'YES' : 'NO'));
        if (patch === TARGET) { process.exit(0); }
      } catch (e) {
        console.log('[poll434147] attempt=' + attempt + ' status=' + res.statusCode + ' parseErr=' + e.message + ' body=' + String(d||'').slice(0,200));
      }
      if (attempt >= MAX_ATTEMPTS) { console.log('[poll434147] TIMEOUT'); process.exit(1); }
      setTimeout(poll, 5000);
    });
  });
  req.on('timeout', () => { req.destroy(); console.log('[poll434147] attempt=' + attempt + ' TIMEOUT_REQ'); if (attempt>=MAX_ATTEMPTS){process.exit(1);} setTimeout(poll, 5000); });
  req.on('error', (e) => { console.log('[poll434147] attempt=' + attempt + ' error=' + e.message); if (attempt>=MAX_ATTEMPTS){process.exit(1);} setTimeout(poll, 5000); });
  req.end();
}
poll();
