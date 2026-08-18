const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const BASE = 'https://adm.italyembalagens.com.br';
const TOKEN = jwt.sign({ id: 't', perfil: 'admin', emp_id: 'E1', sigla: 'ITALY' }, 'italy_secret_2026', { expiresIn: '10h' });
const OUT = '_diag100k.jsonl';
fs.writeFileSync(OUT, '');
function L(o){ fs.appendFileSync(OUT, JSON.stringify(o)+'\n'); console.log(JSON.stringify(o).slice(0,600)); }
function R(method, path, body) {
  return new Promise(resolve => {
    try {
      const u = new URL(BASE + path);
      const opts = { method, hostname: u.hostname, port: 443, path: u.pathname + u.search, timeout: 60000, headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' } };
      const r = https.request(opts, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { let j = null; try { j = d ? JSON.parse(d) : null; } catch (e) { j = {}; } resolve({ s: res.statusCode, j, raw0: d.slice(0, 2000) }); }); });
      r.on('error', e => resolve({ s: 0, j: null, err: String(e.message) })); r.on('timeout', () => { r.destroy(); resolve({ s: -1, j: null, err: 'timeout' }); });
      if (body) r.write(JSON.stringify(body)); r.end();
    } catch (e) { resolve({ s: -2, j: null, err: String(e.message) }); }
  });
}
(async () => {
  // Diagnóstico direto usando endpoint oneshot ITALY com filtro ampliado?
  // Primeiro: listar todas OFs ITALY ativas usando GET /api/ofs com empId
  const E = 'df5f7672-0a6b-402d-ae65-296554236c31';
  // Tentar vários parametros para /api/ofs
  const tentativas = [
    '/api/ofs?limit=1000&empId=' + E,
    '/api/ofs?limit=1000&emp_id=E1',
    '/api/ofs?limit=1000&empresa_id=' + E,
    '/api/ofs?limit=1000'
  ];
  for (const t of tentativas) {
    const r = await R('GET', t);
    const arr = Array.isArray(r.j?.data) ? r.j.data : (Array.isArray(r.j) ? r.j : []);
    const qtd = arr.length;
    let qtd100k = 0;
    let qtdZZZ = 0;
    const ex = [];
    for (const o of arr.slice(0, 300)) {
      const n = parseInt(String(o?.numero || o?.of || '0').replace(/\D/g, ''), 10) || 0;
      const z = /ZZZ_TESTE/i.test(String(o?.clinome || '') + ' ' + String(o?.descricao || ''));
      if (n >= 100000 || z) {
        if (n >= 100000) qtd100k++;
        if (z) qtdZZZ++;
        if (ex.length < 20) ex.push({ id: o.id, num: o.numero, of: o.of, emp_id: o.emp_id, empresa_id: (o.empresa_id || '').slice(0, 12) + '..', desc: String(o.descricao || '').slice(0, 25), cli: String(o.clinome || '').slice(0, 20), del: !!o.deleted_at });
      }
    }
    L({ tentativa: t.slice(0, 60), qtd_total: qtd, qtd_100k_ativas: qtd100k, qtd_ZZZ: qtdZZZ, exemplos: ex });
  }
  // Agora chamar oneshot ITALY com debug: fazer um endpoint temporário?
  // Vamos fazer DELETE manual para cada OF ativa ITALY com num >= 100000 ou desc ZZZ.
  // Usar a busca que retorna mais linhas:
  const rGeral = await R('GET', '/api/ofs?limit=1000');
  const arrG = Array.isArray(rGeral.j?.data) ? rGeral.j.data : (Array.isArray(rGeral.j) ? rGeral.j : []);
  const delOk = []; const delFail = [];
  for (const o of arrG) {
    if (o.deleted_at) continue;
    const n = parseInt(String(o?.numero || o?.of || '0').replace(/\D/g, ''), 10) || 0;
    const z = /ZZZ_TESTE/i.test(String(o?.clinome || '') + ' ' + String(o?.descricao || ''));
    const empId = String(o?.emp_id || '').trim().toUpperCase();
    const empUuid = String(o?.empresa_id || '').trim();
    const pertenceItaly = (empUuid === E) || empId === 'E1';
    if (!pertenceItaly) continue;
    if (n < 100000 && !z) continue;
    const d = await R('DELETE', '/api/ofs/' + o.id);
    if (d.j?.ok) delOk.push({ id: o.id, num: o.numero });
    else delFail.push({ id: o.id, num: o.numero, s: d.s, err: String(d.j?.error || '').slice(0, 100) });
  }
  L({ apagou_manual: { qtdOk: delOk.length, qtdFail: delFail.length, delOk, delFail } });
  // ProxNum após limpeza manual
  const pn = await R('GET', '/api/ofs/proximo-numero?empId=' + E);
  L({ proxnum: pn.j });
})();
