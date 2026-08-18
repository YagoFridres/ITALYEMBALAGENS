const fs = require('fs');
const BASE = 'https://adm.italyembalagens.com.br';
const KEY = 'ITALY_PROBE_2026_08_13_V0804';
(async () => {
  const log = (s) => { try { fs.appendFileSync('_probe_run_log.txt', s + '\n', 'utf8'); } catch(_){ console.log(s); } };
  log('START ' + new Date().toISOString());
  try {
    const t0 = Date.now();
    const r = await fetch(BASE + '/api/_diag_public_v0804?key=' + KEY, { signal: AbortSignal.timeout(180000) });
    const ms = Date.now() - t0;
    const j = await r.json();
    fs.writeFileSync('PROBE_V0808_FINAL.json', JSON.stringify({ probe_ms: ms, probe_status: r.status, result: j }, null, 2), 'utf8');
    log('PROBE_OK ms=' + ms);
  } catch (e) {
    fs.writeFileSync('PROBE_V0808_FINAL.json', JSON.stringify({ probe_err: String(e.message||e).slice(0,1000) }, null, 2), 'utf8');
    log('PROBE_ERR ' + String(e?.message || e).slice(0,200));
  }
  try {
    const t0 = Date.now();
    const r = await fetch(BASE + '/api/_oneshot_hard_delete_zzz_teste_768_771', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: KEY }),
      signal: AbortSignal.timeout(120000),
    });
    const ms = Date.now() - t0;
    const j = await r.json();
    fs.writeFileSync('PROBE_V0808_DELETE_ZZZ.json', JSON.stringify({ del_ms: ms, del_status: r.status, result: j }, null, 2), 'utf8');
    log('DELETE_OK ms=' + ms);
  } catch (e) {
    fs.writeFileSync('PROBE_V0808_DELETE_ZZZ.json', JSON.stringify({ del_err: String(e.message||e).slice(0,1000) }, null, 2), 'utf8');
    log('DELETE_ERR ' + String(e?.message || e).slice(0,200));
  }
  log('DONE ' + new Date().toISOString());
  process.exit(0);
})();
