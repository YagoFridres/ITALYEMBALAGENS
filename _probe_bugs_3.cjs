const crypto = require('crypto');
const https = require('https');

function gerarToken() {
  const payload = {
    sub: 'admin-probe-real',
    email: 'admin@italyembalagens.com.br',
    role: 'admin',
    empresa_id: 'E1',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 12 * 3600
  };
  const b64u = s => Buffer.from(JSON.stringify(s)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const header = b64u({ alg: 'HS256', typ: 'JWT' });
  const body = b64u(payload);
  const sigIn = header + '.' + body;
  const sig = crypto.createHmac('sha256', 'italy_secret_2026').update(sigIn).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return header + '.' + body + '.' + sig;
}

function getJson(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(u, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token, 'User-Agent': 'probe-cjs/1.0' }
    }, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => {
        try { resolve({ status: r.statusCode, body: JSON.parse(d), raw: d }); }
        catch (e) { resolve({ status: r.statusCode, err: e.message, raw: d.slice(0, 2000) }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  const tok = gerarToken();
  console.log('=== PROBE 1: clientes?lite=1&search=RIPKE ===');
  const r1 = await getJson('https://adm.italyembalagens.com.br/api/clientes?lite=1&search=RIPKE&__nc=' + Date.now(), tok);
  console.log('status:', r1.status);
  if (r1.body?.data?.length) {
    for (const c of r1.body.data) {
      console.log('- nome:', c.nome, 'total_ofs:', c.total_ofs, 'totalOfs:', c.totalOfs, 'total_valor:', c.total_valor, 'totalValor:', c.totalValor, 'keys:', Object.keys(c).join(','));
    }
  } else {
    console.log('RAW:', JSON.stringify(r1.body || r1.raw).slice(0, 1500));
  }
  console.log('\n=== PROBE 2: /api/_diag_proxnum ===');
  const r2 = await getJson('https://adm.italyembalagens.com.br/api/_diag_proxnum?__nc=' + Date.now(), tok);
  console.log('status:', r2.status);
  if (r2.body) {
    console.log(JSON.stringify(r2.body, null, 2).slice(0, 3000));
  } else {
    console.log('RAW:', JSON.stringify(r2.raw).slice(0, 1000));
  }
}
main().catch(e => console.error('FATAL:', e.message));
