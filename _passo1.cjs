const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const BASE = 'https://adm.italyembalagens.com.br';
const TOKEN = jwt.sign({ id: 't', perfil: 'admin' }, 'italy_secret_2026', { expiresIn: '10h' });
const EMP_UUID = 'df5f7672-798e-4a6e-9393-3d46ed2d0d1f';
const OUT_FILE = '_DIAG_STEPS.jsonl';
fs.writeFileSync(OUT_FILE, '');

function log(obj) {
  fs.appendFileSync(OUT_FILE, JSON.stringify(obj) + '\n');
  process.stdout.write(JSON.stringify(obj).slice(0, 300) + '\n');
}

function req(method, path, body = null) {
  return new Promise((resolve) => {
    try {
      const u = new URL(BASE + path);
      const opts = {
        method,
        hostname: u.hostname,
        port: 443,
        path: u.pathname + u.search,
        timeout: 25000,
        headers: {
          'Authorization': 'Bearer ' + TOKEN,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      const reqObj = https.request(opts, (res) => {
        let data = '';
        res.on('data', (c) => data += c);
        res.on('end', () => {
          let json = null;
          try { json = data ? JSON.parse(data) : null; } catch (_) { json = { _raw: data.slice(0, 500) }; }
          resolve({ s: res.statusCode, json, raw0: data.slice(0, 500) });
        });
      });
      reqObj.on('timeout', () => { reqObj.destroy(); resolve({ s: -1, json: null, err: 'timeout' }); });
      reqObj.on('error', (e) => resolve({ s: 0, json: null, err: String(e.message || e) }));
      if (body) reqObj.write(JSON.stringify(body));
      reqObj.end();
    } catch (e) { resolve({ s: -2, json: null, err: String(e.message || e) }); }
  });
}

(async () => {
  log({ step: 0, t: 'PROX_NUM_ANTES', start: Date.now() });

  // STEP 1: proximo numero
  const pn = await req('GET', '/api/ofs/proximo-numero?empId=' + EMP_UUID);
  log({ step: 1, t: 'PROX_NUM_ANTES', resp: pn.json || pn.raw0, s: pn.s });

  // STEP 2: top 30 OFs por created_at DESC (depois ordenamos por numero no JS)
  const ofs = await req('GET', '/api/ofs?limit=50&order=created_at.desc&empId=' + EMP_UUID);
  let rows = [];
  if (ofs.json?.ok) {
    if (Array.isArray(ofs.json.ofs)) rows = ofs.json.ofs;
    else if (Array.isArray(ofs.json.data)) rows = ofs.json.data;
  }
  // Ordenar por numero desc
  rows.sort((a, b) => {
    const na = parseInt(String(a?.numero || a?.of || '0').replace(/\D/g, ''), 10) || 0;
    const nb = parseInt(String(b?.numero || b?.of || '0').replace(/\D/g, ''), 10) || 0;
    return nb - na;
  });
  const top15num = rows.slice(0, 15).map(o => ({
    n: o.numero || o.of,
    del: o.deleted_at ? 'S' : 'N',
    c: String(o.clinome || '').slice(0, 25),
    d: String(o.descricao || '').slice(0, 40)
  }));
  const ativasAltoNum = rows.filter(o => {
    const n = parseInt(String(o.numero || o.of || '0').replace(/\D/g, ''), 10) || 0;
    return n >= 2600 && !o.deleted_at;
  }).map(o => ({ n: o.numero || o.of, del: o.deleted_at ? 'S' : 'N', c: String(o.clinome || '').slice(0, 25), d: String(o.descricao || '').slice(0, 30), id: o.id }));
  log({ step: 2, t: 'TOP15_NUM_DESC', qtd_total: rows.length, top15: top15num, alto_ativas: ativasAltoNum });

  // STEP 3: Buscar RIPKE
  const cr = await req('GET', '/api/clientes?limit=5&search=RIPKE&empId=' + EMP_UUID);
  let arr = [];
  if (cr.json?.ok) arr = Array.isArray(cr.json.data) ? cr.json.data : (Array.isArray(cr.json) ? cr.json : []);
  log({ step: 3, t: 'RIPKE', qtd: arr.length, q: arr.map(c => ({ id: c.id, nome: c.nome, codigo: c.codigo, emp_id: c.emp_id })) });

  log({ step: 99, t: 'FIM_STEPS_1_2_3' });
  process.exit(0);
})().catch(e => { log({ err: String(e) }); process.exit(1); });
