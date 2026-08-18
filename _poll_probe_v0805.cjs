const wantedP = '20260813080500';
const wantedC = '7daadec';
const BASE = 'https://adm.italyembalagens.com.br';
(async () => {
  for (let i = 0; i < 30; i++) {
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 8000);
      const r = await fetch(BASE + '/api/version', { signal: ctrl.signal });
      clearTimeout(to);
      if (r.status === 200) {
        try {
          const j = await r.json();
          const p = String(j?.runtime?.patch || '');
          const c = String(j?.git?.commit || '').slice(0, 7);
          console.log('HTTP=200 patch=' + p + ' commit=' + c);
          if (p === wantedP || c === wantedC) {
            const key = 'ITALY_PROBE_2026_08_13_V0804';
            try {
              const ctrl2 = new AbortController();
              const to2 = setTimeout(() => ctrl2.abort(), 60000);
              const r2 = await fetch(BASE + '/api/_diag_public_v0804?key=' + key, { signal: ctrl2.signal });
              clearTimeout(to2);
              console.log('PROBE_HTTP=' + r2.status);
              const txt = await r2.text();
              process.stdout.write(txt);
            } catch (e) { console.log('PROBE_ERR=' + String(e.message || e).slice(0, 200)); }
            process.exit(0);
          }
        } catch (_e) { console.log('json parse fail'); }
      } else {
        console.log('HTTP=' + r.status);
      }
    } catch (e) { console.log('err=' + String(e?.message || e).slice(0, 100)); }
    await new Promise(r => setTimeout(r, 5000));
  }
  process.exit(1);
})();
