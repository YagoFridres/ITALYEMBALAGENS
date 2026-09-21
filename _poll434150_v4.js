const https = require('https');
const URL_API = 'https://adm.italyembalagens.com.br/api/version?_t=';

async function main() {
  const MAX_TENT = Date.now() + 540000;
  let tent = 0;
  const T = 0;
  const target = {
    patch: '20260921171000',
    shaPrefix: 'b7d111a',
    branch: 'main'
  };
  while (Date.now() < MAX_TENT) {
    tent++;
    const t = Date.now();
    try {
      const json = await new Promise((resolve, reject) => {
        const url = URL_API + t;
        https.get(url, { timeout: 10000 }, (res) => {
          let d = '';
          res.on('data', c => d += c);
          res.on('end', () => {
            try { resolve(JSON.parse(d)); } catch (e) { reject(e); }
          });
        }).on('error', reject).on('timeout', function() { this.destroy(new Error('timeout')); });
      };
      const rtP = String(json?.runtime?.patch || '').trim();
      const swP = String(json?.runtime?.sw || '').trim();
      const sha = String(json?.git?.sha || '').trim();
      const branch = String(json?.git?.branch || '').trim();
      const shaOK = sha.startsWith(target.shaPrefix);
      const patchOK = rtP === target.patch;
      const branchOK = branch === target.branch;
      console.log('T' + tent + ' | patch=' + rtP + ' sw=' + swP + ' sha=' + sha.slice(0,12) + ' branch=' + branch + ' | patchOK=' + patchOK + ' shaOK=' + shaOK + ' branchOK=' + branchOK);
      if (patchOK && shaOK && branchOK) {
        console.log('\n✅ MATCHED 434150! runtime.patch=' + rtP + ' sha=' + sha + ' branch=' + branch);
        process.exit(0);
      }
    } catch (e) {
      console.log('T' + tent + ' ERRO: ' + String(e.message || e));
    }
    await new Promise(r => setTimeout(r, 5000));
  }
  console.log('TIMEOUT POLL 434150');
  process.exit(1);
}
main();
