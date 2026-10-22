'use strict';
// REL-06 · "Chapas abaixo de 200" listava 178 chapas zeradas.
// Causa: a rota /api/relatorios/chapas-abaixo-200 lia `row.quantidade`, que é 0
// em todas, e filtrava sempre por `< 200` (ignorando o estoque_minimo).
// Correto: saldo = `quantidade_atual`; limite = `estoque_minimo` (ou 200).
//
// Roda a ROTA REAL extraída de server.js num sandbox vm, com um Supabase falso.
//
// Rodar: node --test tests/aud_rel06_chapas_abaixo_200.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8').replace(/\r\n/g, '\n');

const MARK = "app.get('/api/relatorios/chapas-abaixo-200'";

function extrairRota(src, marcador) {
  const i = src.indexOf(marcador);
  assert.ok(i >= 0, 'rota não encontrada: ' + marcador);
  const j = src.indexOf('(', i);
  let d = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === '(') d++;
    else if (src[k] === ')') { d--; if (d === 0) return src.slice(i, k + 1) + ';'; }
  }
  throw new Error('fim da rota não achado: ' + marcador);
}

const EXPR = extrairRota(SRC, MARK);

function fakeSupabase(rows) {
  return {
    from() {
      const self = {
        select() { return self; },
        limit() { return self; },
        then(resolve) { return Promise.resolve({ data: rows, error: null }).then(resolve); },
      };
      return self;
    },
  };
}

async function rodar(rows) {
  let handler = null;
  const ctx = {
    console: { log() {}, warn() {}, error() {} },
    supabase: fakeSupabase(rows),
    setNoCache() {},
    _chapasPreferV2Table: async () => 'chapas_estoque_v2',
    authMiddleware() {},
    app: { get(_p, _mw, fn) { handler = fn; } },
  };
  vm.createContext(ctx);
  vm.runInContext(EXPR, ctx);
  assert.ok(typeof handler === 'function', 'handler não capturado');
  const res = {
    code: 0, body: null,
    status(c) { this.code = c; return this; },
    json(b) { this.body = b; return this; },
  };
  await handler({ query: {}, params: {} }, res);
  return { status: res.code, body: res.body };
}

test('REL-06 fonte: saldo vem de quantidade_atual e o corte respeita estoque_minimo', () => {
  const i = SRC.indexOf(MARK);
  const bloco = SRC.slice(i, i + 3000);
  assert.ok(/quantidade_atual\s*\?\?\s*row\?\.quantidade/.test(bloco), 'saldo deve ser quantidade_atual');
  assert.ok(!/Number\(row\?\.quantidade\s*\?\?\s*0\)/.test(bloco), 'não pode voltar a usar row.quantidade como saldo');
  assert.ok(/estoque_minimo/.test(bloco) && /< Number\(row\?\.estoque_minimo/.test(bloco), 'o corte deve usar estoque_minimo');
});

test('REL-06 funcional: usa quantidade_atual (não o quantidade legado, que é 0)', async () => {
  const { status, body } = await rodar([
    { id: 'c1', nomenclatura: 'KRAFT', quantidade: 0, quantidade_atual: 120, estoque_minimo: 200 },
    { id: 'c2', nomenclatura: 'BRANCO', quantidade: 0, quantidade_atual: 5000, estoque_minimo: 200 },
  ]);
  assert.equal(status, 0);
  assert.equal(body.ok, true);
  assert.equal(body.rows.length, 1, 'só a chapa com saldo 120 fica abaixo de 200');
  assert.equal(body.rows[0].id, 'c1');
  assert.equal(body.rows[0].quantidade_atual, 120);
  assert.equal(body.resumo.total_chapas, 1);
  assert.equal(body.resumo.quantidade_total, 120);
});

test('REL-06 funcional: estoque_minimo próprio manda no limite', async () => {
  const { body } = await rodar([
    { id: 'c1', quantidade_atual: 150, estoque_minimo: 100 }, // 150 >= 100 -> fora
    { id: 'c2', quantidade_atual: 150, estoque_minimo: 300 }, // 150 <  300 -> dentro
    { id: 'c3', quantidade_atual: 10, estoque_minimo: null }, // limite padrão 200 -> dentro
    { id: 'c4', quantidade_atual: 10, estoque_minimo: 0 },    // limite padrão 200 -> dentro
  ]);
  const ids = body.rows.map((r) => r.id).sort();
  assert.equal(ids.join(','), 'c2,c3,c4');
  const c3 = body.rows.find((r) => r.id === 'c3');
  const c4 = body.rows.find((r) => r.id === 'c4');
  assert.equal(c3.estoque_minimo, 200);
  assert.equal(c4.estoque_minimo, 200);
});

test('REL-06 funcional: ordena pelo saldo crescente', async () => {
  const { body } = await rodar([
    { id: 'c1', quantidade_atual: 150 },
    { id: 'c2', quantidade_atual: 0 },
    { id: 'c3', quantidade_atual: 90 },
  ]);
  assert.equal(body.rows.map((r) => r.id).join(','), 'c2,c3,c1');
});

test('REL-06 funcional: sem chapas abaixo do limite -> 0/0 (sem erro)', async () => {
  const { body } = await rodar([
    { id: 'c1', quantidade_atual: 200, estoque_minimo: 200 },
    { id: 'c2', quantidade_atual: 999, estoque_minimo: 200 },
  ]);
  assert.equal(body.rows.length, 0);
  assert.equal(body.resumo.total_chapas, 0);
  assert.equal(body.resumo.quantidade_total, 0);
});
