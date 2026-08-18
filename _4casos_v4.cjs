const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const T = jwt.sign({ id: 't', perfil: 'admin' }, 'italy_secret_2026', { expiresIn: '8h' });
const EU = 'df5f7672-0a6b-402d-ae65-296554236c31';
const VEND = 'b362b262-0b8f-40e3-865f-7eb5bfe226c8';
const RIPKE_ID = 'be617df1-441a-4f11-918e-d813a5ac854c';

function POST(body) {
  return new Promise((res) => {
    const bdy = JSON.stringify(body);
    const hdr = {
      Accept: 'application/json',
      'Cache-Control': 'no-cache',
      Authorization: 'Bearer ' + T,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(bdy),
    };
    const o = { host: 'adm.italyembalagens.com.br', port: 443, method: 'POST', path: '/api/ofs', headers: hdr, timeout: 240000 };
    const rq = https.request(o, (r) => {
      let b = '';
      r.on('data', (d) => { b += d; });
      r.on('end', () => {
        let j = null; try { j = JSON.parse(b); } catch (_) { }
        res({ s: r.statusCode, j: j, b: b.slice(0, 2000) });
      });
    });
    rq.setTimeout(240000, () => { try { rq.destroy(); } catch (_) { } res({ ne: 'T' }); });
    rq.on('error', (e) => { res({ ne: String(e?.message || e) }); });
    rq.write(bdy); rq.end();
  });
}
function DEL_ID(id) {
  return new Promise((res) => {
    const hdr = {
      Accept: 'application/json',
      'Cache-Control': 'no-cache',
      Authorization: 'Bearer ' + T,
    };
    const o = { host: 'adm.italyembalagens.com.br', port: 443, method: 'DELETE', path: '/api/ofs/' + id, headers: hdr, timeout: 120000 };
    const rq = https.request(o, (r) => {
      let b = '';
      r.on('data', (d) => { b += d; });
      r.on('end', () => {
        let j = null; try { j = JSON.parse(b); } catch (_) { }
        res({ s: r.statusCode, j: j });
      });
    });
    rq.setTimeout(120000, () => { try { rq.destroy(); } catch (_) { } res({ ne: 'T' }); });
    rq.on('error', (e) => { res({ ne: String(e?.message || e) }); });
    rq.end();
  });
}
function GET(url) {
  return new Promise((res) => {
    const hdr = { Accept: 'application/json', 'Cache-Control': 'no-cache', Authorization: 'Bearer ' + T };
    const o = { host: 'adm.italyembalagens.com.br', port: 443, method: 'GET', path: url, headers: hdr, timeout: 120000 };
    const rq = https.request(o, (r) => {
      let b = '';
      r.on('data', (d) => { b += d; });
      r.on('end', () => {
        let j = null; try { j = JSON.parse(b); } catch (_) { }
        res({ s: r.statusCode, j: j, b: b.slice(0, 1000) });
      });
    });
    rq.setTimeout(120000, () => { try { rq.destroy(); } catch (_) { } res({ ne: 'T' }); });
    rq.on('error', (e) => { res({ ne: String(e?.message || e) }); });
    rq.end();
  });
}
function norm(s) {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}
function mk(n, c, p) {
  return {
    empresa_id: EU, empId: EU, emp_id: 'E1',
    vendedor_id: VEND, vendId: VEND,
    cli_id: c, cliId: c, cliente_id: c,
    numero: n, of: n,
    produto: p, qtd: 1, valor_unitario: 10, valor_total: 10,
    data_entrega: '2026-12-31', data_pedido: '2026-08-12', status: 'Em aberto',
    caixa_comprimento: 10, caixa_largura: 10,
    itens: [{ desc: p, qtd: 1, valor_unitario: 10 }],
    imgs: [],
  };
}
async function run(name, num, cli, prod, fn) {
  const body = mk(num, cli, prod);
  const r = await POST(body);
  const id = r.j?.data?.id || '';
  const row = {
    t: name, s: r.s,
    id: (id || '').slice(0, 14),
    cid: (r.j?.data?.cli_id || r.j?.data?.cliente_id || '').slice(0, 14),
    clinome: r.j?.data?.clinome || r.j?.data?.cliente_nome || '',
    modo: r.j?.data?.modo_resolvido || '',
    err: r.j?.error || null,
    ref: r.j?.ref || null,
    qtd: r.j?.qtd || null,
    ops: (r.j?.candidatos || []).map((x) => x.nome || '').slice(0, 5),
    del: null,
    ok: false,
  };
  try { row.ok = !!fn(row); } catch (_) { row.ok = false; }
  if (r.s === 200 && id) {
    const dd = await DEL_ID(id);
    const delok = !!(
      dd.s === 200 || dd.s === 204 ||
      dd.j?.ok === true ||
      (dd.j?.data && dd.j.data.deleted_at) ||
      dd.j?.deleted_at
    );
    row.del = { s: dd.s, ok: delok };
  } else {
    row.del = { s: null, ok: true };
  }
  return row;
}
async function main() {
  const OUT = [];
  const p0 = await GET('/api/ofs/proximo-numero?nc=' + Date.now());
  OUT.push({ t: 'PROX_ANTES', proximo: p0.j?.proximo, maior: p0.j?.maior, s: p0.s });
  OUT.push(await run(
    'BASELINE_UUID', '99700', RIPKE_ID, 'ZZZ_TESTE_APAGAR_BASELINE_UUID_V4',
    (x) => x.s === 200 && x.cid.slice(0, 8) === RIPKE_ID.slice(0, 8) && norm(x.clinome) === norm('MOVEIS RIPKE')
  ));
  await new Promise((r) => setTimeout(r, 500));
  OUT.push(await run(
    'EXATO_BANCO_UPPER', '99695', 'MOVEIS RIPKE', 'ZZZ_TESTE_APAGAR_EXATO_BANCO_V4',
    (x) => x.s === 200 && x.cid.slice(0, 8) === RIPKE_ID.slice(0, 8) && norm(x.clinome) === norm('MOVEIS RIPKE')
  ));
  await new Promise((r) => setTimeout(r, 500));
  OUT.push(await run(
    'CASO_A_ACENTO', '99699', 'MÓVEIS RIPKE', 'ZZZ_TESTE_APAGAR_CASOA_V4',
    (x) => x.s === 200 && x.cid.slice(0, 8) === RIPKE_ID.slice(0, 8) && norm(x.clinome) === norm('MOVEIS RIPKE')
  ));
  await new Promise((r) => setTimeout(r, 500));
  OUT.push(await run(
    'CASO_B_SEMACENTO_MINUSC', '99698', 'moveis ripke', 'ZZZ_TESTE_APAGAR_CASOB_V4',
    (x) => x.s === 200 && x.cid.slice(0, 8) === RIPKE_ID.slice(0, 8) && norm(x.clinome) === norm('MOVEIS RIPKE')
  ));
  await new Promise((r) => setTimeout(r, 500));
  OUT.push(await run(
    'CASO_C_INEXISTENTE', '99697', 'cliente xablau 9999', 'ZZZ_TESTE_APAGAR_CASOC_V4',
    (x) => x.s === 400 && String(x.err || '').length > 0 && norm(x.ref || '').includes('xablau 9999')
  ));
  await new Promise((r) => setTimeout(r, 500));
  OUT.push(await run(
    'CASO_D_AMBIGUO', '99696', 'moveis', 'ZZZ_TESTE_APAGAR_CASOD_V4',
    (x) => {
      const amb = x.s === 400 && x.qtd != null && x.qtd >= 2 && Array.isArray(x.ops) && x.ops.length >= 2;
      const uniq = x.s === 200 && x.cid.length > 0;
      return amb || uniq;
    }
  ));
  const pN = await GET('/api/ofs/proximo-numero?nc=' + Date.now());
  OUT.push({ t: 'PROX_DEPOIS', proximo: pN.j?.proximo, maior: pN.j?.maior, s: pN.s });
  const todosBool = OUT.filter((x) => typeof x.ok === 'boolean');
  const resumo = {
    passou: todosBool.filter((x) => x.ok === true).length,
    total: todosBool.length,
    tudo: todosBool.length > 0 && todosBool.every((x) => x.ok === true),
  };
  OUT.push({ t: 'RESUMO', ...resumo });
  try { fs.writeFileSync('_4CASOS_V4.json', JSON.stringify(OUT, null, 2)); } catch (e) {
    try { fs.writeFileSync('_4CASOS_ERR.txt', String(e?.message || e)); } catch (_) { }
  }
  // resumo no console
  for (const x of OUT) {
    const line = JSON.stringify(x);
    console.log(line.length < 500 ? line : line.slice(0, 500));
  }
  process.exit(resumo.tudo ? 0 : 1);
}
main().catch((e) => {
  try { fs.writeFileSync('_4CASOS_CATCH.txt', String(e?.message || e)); } catch (_) { }
  console.error('ERRO FATAL:', e?.message || e);
  process.exit(2);
});
