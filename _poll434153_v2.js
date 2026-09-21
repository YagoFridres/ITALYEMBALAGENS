const https = require('https');
let attempts = 0;
function one() {
  attempts++;
  https.get('https://adm.italyembalagens.com.br/api/version', { headers: { 'User-Agent': 'poll-434153-v2' } }, (r) => {
    let d = '';
    r.on('data', c => d += c);
    r.on('end', () => {
      try {
        const j = JSON.parse(d);
        const p = String(j.runtime && j.runtime.patch || '');
        const b = String(j.git && j.git.branch || '');
        const cr = String(j.git && (j.git.commit_raw || j.git.sha || '') || '');
        const m1 = p === '20260921201000';
        const m2 = b === 'main';
        const m3 = cr.indexOf('399d26c') === 0;
        const t = new Date().toISOString().slice(11, 19);
        console.log(`[${t}] try=${String(attempts).padStart(2)} patch=${p}(${m1?'MATCH':'NOMATCH'}) branch=${b}(${m2?'MATCH':'NOMATCH'}) commit_raw_14=${cr.slice(0,14)}(${m3?'MATCH':'NOMATCH'})`);
        if (m1 && m2 && m3) { console.log('\n✅ 3/3 GATES MATCHED Railway deploy 434153 R7-T4 Jarvis overlay trava concluído!'); process.exit(0); }
      } catch (e) { console.log('parse_err', attempts, e.message, d.slice(0, 100)); }
      if (attempts < 90) setTimeout(one, 4500);
      else { console.log('TIMEOUT 90x4.5s ≈ 6.7 min'); process.exit(1); }
    });
  }).on('error', (e) => { console.log('net_err', attempts, e.message); if (attempts < 90) setTimeout(one, 4500); else process.exit(1); });
}
one();
