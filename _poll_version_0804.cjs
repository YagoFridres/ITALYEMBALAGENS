const url1 = 'https://italyembalagens.up.railway.app/api/version';
const url2 = 'https://adm.italyembalagens.com.br/api/version';
const wanted = '20260813080400';
const commitWanted = '730404c';
(async () => {
  for (let i = 0; i < 30; i++) {
    try {
      for (const [label, url] of [['railway', url1], ['cloudflare', url2]]) {
        try {
          const ctrl = new AbortController();
          const to = setTimeout(() => ctrl.abort(), 7000);
          const r = await fetch(url, { signal: ctrl.signal });
          clearTimeout(to);
          if (r.status === 200) {
            try {
              const j = await r.json();
              const p = String(j?.patch || '');
              const c = String(j?.commit || '').slice(0, 7);
              const ok = (p === wanted || c === commitWanted);
              console.log(label + ' HTTP=200 patch=' + p + ' commit=' + c + (ok ? ' OK!' : ' ...'));
              if (ok) { process.exit(0); }
            } catch (_e) { console.log(label + ' HTTP=200 JSON parse failed'); }
          } else {
            console.log(label + ' HTTP=' + r.status);
          }
        } catch (e) { console.log(label + ' err=' + String(e?.message || e).slice(0, 80)); }
      }
    } catch (_) { }
    await new Promise(r => setTimeout(r, 5000));
  }
  process.exit(1);
})();
