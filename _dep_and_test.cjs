const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const T = jwt.sign({ id: 't', perfil: 'admin' }, 'italy_secret_2026', { expiresIn: '10h' });
const EU = 'df5f7672-0a6b-402d-ae65-296554236c31';
const VEND = 'b362b262-0b8f-40e3-865f-7eb5bfe226c8';
const RIPKE = 'be617df1-441a-4f11-918e-d813a5ac854c';

function norm(s) {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function R(op) {
  return new Promise((res) => {
    const hdr = { Accept: 'application/json', 'Cache-Control': 'no-cache', Authorization: 'Bearer ' + T };
    if (op.body) {
      hdr['Content-Type'] = 'application/json';
      hdr['Content-Length'] = Buffer.byteLength(op.body);
    }
    const o = { host: 'adm.italyembalagens.com.br', port: 443, method: op.method || 'GET', path: op.path, headers: hdr, timeout: op.timeout || 90000 };
    const rq = https.request(o, (r) => {
      let b = '';
      r.on('data', (d) => { b += d; });
      r.on('end', () => {
        let j = null;
        try { j = JSON.parse(b); } catch (_) { }
        res({ s: r.statusCode, j, b: b.slice(0, 2000) });
      });
    });
    rq.setTimeout(op.timeout || 90000, () => { try { rq.destroy(); } catch (_) { } res({ ne: 'T' }); });
    rq.on('error', (e) => { res({ ne: String(e?.message || e) }); });
    if (op.body) rq.write(op.body);
    rq.end();
  });
}
const GET = (p) => R({ method: 'GET', path: p, timeout: 90000 });
const POST = (b) => R({ method: 'POST', path: '/api/ofs', body: JSON.stringify(b), timeout: 180000 });
const DELID = (id) => R({ method: 'DELETE', path: '/api/ofs/' + id, timeout: 90000 });

function mk(n, c, p) {
  return {
    empresa_id: EU, empId: EU, emp_id: 'E1',
    vendedor_id: VEND, vendId: VEND,
    cli_id: c, cliId: c, cliente_id: c,
    numero: n, of: n, produto: p, qtd: 1,
    valor_unitario: 10, valor_total: 10,
    data_entrega: '2026-12-31', data_pedido: '2026-08-12',
    status: 'Em aberto', caixa_comprimento: 10, caixa_largura: 10,
    itens: [{ desc: p, qtd: 1, valor_unitario: 10 }],
    imgs: [],
  };
}

async function main() {
  const OUT = [];
  let dep = false;
  for (let i = 1; i <= 22; i++) {
    const v = await GET('/api/version?nc=' + Date.now() + '_' + i);
    const pv = String(v.j?.runtime?.patch || '').trim();
    const cm = String(v.j?.git?.commit || '').slice(0, 7);
    const ok = pv === '20260812120000' || cm === '3049359';
    OUT.push({ t: 'DEP', i, s: v.s, pv, cm, ok });
    if (ok) { dep = true; break; }
    await new Promise((r) => setTimeout(r, 6000));
  }
  const p0 = await GET('/api/ofs/proximo-numero?nc=' + Date.now());
  OUT.push({ t: 'PROX0', proximo: p0.j?.proximo, maior: p0.j?.maior, ok: p0.j?.proximo === '2605' });
  if (!dep) {
    try { fs.writeFileSync('_DEP_RESULT.json', JSON.stringify(OUT, null, 2)); console.log('deploy nao chegou, arquivo salvo'); } catch (_) { }
    process.exit(4);
  }
  await new Promise((r) => setTimeout(r, 500));
  const b1 = await POST(mk('99700', RIPKE, 'ZZZ_APAGAR_DEP_V2_BASELINE'));
  const d1 = b1.j?.data || {};
  const id1 = d1.id || '';
  const c1 = {
    t: 'BASE', s: b1.s,
    cid: (d1.cli_id || '').slice(0, 14),
    nome: d1.clinome || '',
    modo: d1.modo_resolvido || '',
    del: null,
    ok: b1.s === 200 && (d1.cli_id || '').slice(0, 8) === RIPKE.slice(0, 8) && norm(d1.clinome || '') === norm('MOVEIS RIPKE'),
  };
  if (b1.s === 200 && id1) {
    const dd = await DELID(id1);
    c1.del = { s: dd.s, ok: !!(dd.s === 200 || dd.s === 204 || dd.j?.ok || dd.j?.data?.deleted_at || dd.j?.deleted_at) };
  } else {
    c1.del = { ok: true, s: null };
  }
  OUT.push(c1);
  await new Promise((r) => setTimeout(r, 500));
  const b2 = await POST(mk('99695', 'MOVEIS RIPKE', 'ZZZ_APAGAR_DEP_V2_EXATO'));
  const d2 = b2.j?.data || {};
  const id2 = d2.id || '';
  const c2 = {
    t: 'EXATO', s: b2.s,
    cid: (d2.cli_id || '').slice(0, 14),
    nome: d2.clinome || '',
    modo: d2.modo_resolvido || '',
    err: b2.j?.error || null,
    ref: b2.j?.ref || null,
    del: null,
    ok: b2.s === 200 && (d2.cli_id || '').slice(0, 8) === RIPKE.slice(0, 8) && norm(d2.clinome || '') === norm('MOVEIS RIPKE'),
  };
  if (b2.s === 200 && id2) {
    const dd = await DELID(id2);
    c2.del = { s: dd.s, ok: !!(dd.s === 200 || dd.s === 204 || dd.j?.ok || dd.j?.data?.deleted_at || dd.j?.deleted_at) };
  } else {
    c2.del = { ok: true, s: null };
  }
  OUT.push(c2);
  const pN = await GET('/api/ofs/proximo-numero?nc=' + Date.now());
  OUT.push({ t: 'PROXN', proximo: pN.j?.proximo, maior: pN.j?.maior, ok: pN.j?.proximo === '2605' });
  try { fs.writeFileSync('_DEP_RESULT.json', JSON.stringify(OUT, null, 2)); } catch (_) { }
  for (const x of OUT) { console.log(JSON.stringify(x)); }
  const tudoBool = OUT.filter((x) => typeof x.ok === 'boolean');
  const tudoOK = tudoBool.length > 0 && tudoBool.every((x) => x.ok === true);
  process.exit(tudoOK ? 0 : 1);
}

main().catch((e) => {
  try { fs.writeFileSync('_DEP_ERR.txt', String(e?.message || e)); } catch (_) { }
  console.error('CATCH', e?.message || e);
  process.exit(2);
});
