const https = require('https');
const TARGET = '20260812143955';
async function main() {
  for (let i = 1; i <= 25; i++) {
    try {
      const p = await new Promise((resolve, reject) => {
        const o = { hostname: 'adm.italyembalagens.com.br', path: '/?_=' + Date.now(), timeout: 15000 };
        const r = https.request(o, res => {
          let d = ''; res.on('data', c => d += c); res.on('end', () => {
            const m = d.match(/patch\.js\?v=(\d+)/);
            resolve(m ? m[1] : null);
          });
        });
        r.on('error', e => reject(e));
        r.on('timeout', () => { r.destroy(); reject(new Error('timeout')); });
        r.end();
      });
      console.log('i=' + i + ' patch=' + p + ' ok=' + (p === TARGET));
      if (p === TARGET) { console.log('DEPLOY_OK'); process.exit(0); }
    } catch (e) {
      console.log('i=' + i + ' ERR ' + e.message);
    }
    await new Promise(r => setTimeout(r, 6000));
  }
  console.log('DEPLOY_TIMEOUT');
  process.exit(2);
}
main();
