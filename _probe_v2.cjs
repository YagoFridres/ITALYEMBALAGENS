const signAdminToken = (payload) => {
  const h = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const p = Object.assign({
    iss: 'italy-local-diag', iat: now - 30, exp: now + 6 * 3600,
    id: 'diag-local-probe-0001', perfil: 'admin',
    email: 'diag0001@italyembalagens.local', nome: 'Diag Local Probe 0001',
    permissoes: ['tudo'],
    empresa_id: (payload && payload.empresa_id) || 'df5f7672-0a6b-402d-ae65-296554236c31',
    emp_id: (payload && payload.emp_id) || '1'
  }, payload || {});
  const base = (v) => Buffer.from(JSON.stringify(v)).toString('base64url');
  const input = base(h) + '.' + base(p);
  const crypto = require('crypto');
  const sig = crypto.createHmac('sha256', 'italy-erp-dev-local-2025-ignored-unsued').update(input).digest('base64url');
  return { token: input + '.' + sig, payload: p };
};
const BASE = 'https://adm.italyembalagens.com.br';
const { token } = signAdminToken({});
console.log('token gerado len=' + token.length);

const mk = (url, extraHeaders) => new Promise(async (resolve) => {
  try {
    const t0 = Date.now();
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 30000);
    const hdrs = Object.assign({ 'Authorization': 'Bearer ' + token }, extraHeaders || {});
    const r = await fetch(url, { headers: hdrs, signal: ctrl.signal });
    clearTimeout(to);
    const ms = Date.now() - t0;
    const txt = await r.text();
    let j = null;
    try { if (txt && txt[0] === '{') j = JSON.parse(txt); } catch (_) { }
    resolve({ status: r.status, ms, bodyText: txt.slice(0, 3000), bodyJson: j });
  } catch (e) { resolve({ err: String(e?.message || e).slice(0, 300) }); }
});

(async () => {
  const out = {};
  out.A_proximo_numero = await mk(BASE + '/api/ofs/proximo-numero');
  out.B_diag_proxnum = await mk(BASE + '/api/_diag_proxnum');
  out.C_ripke_clientes = await mk(BASE + '/api/clientes?search=RIPKE&limit=10&lite=1&nocache=' + Date.now());
  const uu = 'be617df1-441a-4f11-918e-d813a5ac854c';
  out.D_ripke_unico_ofs = await mk(BASE + '/api/ofs?cli_id=' + uu + '&limit=1&offset=0&nocache=' + Date.now());
  out.E_ofs_limit50 = await mk(BASE + '/api/ofs?limit=50&offset=0&order_by=created_at&order=desc&nocache=' + Date.now());
  out.F_zzz_768_771 = await mk(BASE + '/api/ofs?busca=ZZZ_TESTE_APAGAR&incluir_excluidas=1&limit=50&nocache=' + Date.now());
  process.stdout.write(JSON.stringify(out, null, 2));
})();
