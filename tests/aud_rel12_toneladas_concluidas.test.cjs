'use strict';
// REL-12 · Toneladas incluía canceladas e usava toneladas "utilizadas".
//
// Causas: (a) a query não filtrava status/deleted_at → OFs canceladas entravam;
// (b) a precedência era `toneladas_utilizadas` antes de `tonelada_vendida`;
// (c) o período era comparado com a data pura (`data_conclusao` é timestamptz).
// Correção: só concluídas e sem `deleted_at`; `tonelada_vendida` primeiro; F-2;
// remove o console.log por OF.
//
// Roda o código REAL da rota `/api/analises/toneladas-vendidas` num sandbox vm,
// com um `supabase` que CAPTURA as operações e devolve linhas fixas (sem banco).
//
// Rodar: node --test tests/aud_rel12_toneladas_concluidas.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8').replace(/\r\n/g, '\n');

function extrairFunc(src, nome) {
  const i = src.indexOf('function ' + nome + '(');
  assert.ok(i >= 0, 'função não encontrada: ' + nome);
  let j = src.indexOf('(', i);
  let d = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === '(') d++;
    else if (src[k] === ')') { d--; if (d === 0) { j = src.indexOf('{', k); break; } }
  }
  d = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (d === 0) return src.slice(i, k + 1); }
  }
  throw new Error('fim não achado: ' + nome);
}

function extrairConst(src, nome) {
  const i = src.indexOf('const ' + nome + ' =');
  assert.ok(i >= 0, 'const não encontrada: ' + nome);
  return src.slice(i, src.indexOf('\n', i));
}

function extrairRota(src, marker) {
  const i = src.indexOf(marker);
  assert.ok(i >= 0, 'rota não encontrada: ' + marker);
  const j = src.indexOf('{', i);
  let d = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (d === 0) return src.slice(i, k + 2); }
  }
  throw new Error('fim da rota não achado: ' + marker);
}

const ROTA_MARKER = "app.get('/api/analises/toneladas-vendidas'";

// Linhas devolvidas pelo "banco" (o stub não aplica os filtros; eles são provados
// pelas operações capturadas). `d` não tem data_conclusao → deve cair no guard JS.
const OFS = [
  { id: 'a', numero: '1', of: '1', data_conclusao: '2026-09-30T23:30:00-03:00', status: 'Concluído', tonelada_vendida: 5, toneladas_utilizadas: 7, qtd_produzida: 100, valor_total: 1000 },
  { id: 'b', numero: '2', of: '2', data_conclusao: '2026-09-10T10:00:00-03:00', status: 'Concluído', tonelada_vendida: 0, toneladas_utilizadas: 3, qtd_produzida: 50, valor_total: 500 },
  { id: 'c', numero: '3', of: '3', data_conclusao: '2026-09-05T10:00:00-03:00', status: 'Concluído', tonelada_vendida: 0, toneladas_utilizadas: 0, qtd_produzida: 1000, gramatura: 100, dim_comprimento: 100, dim_largura: 100, valor_total: 700 },
  { id: 'd', numero: '4', of: '4', data_conclusao: null, status: 'Concluído', tonelada_vendida: 9, qtd_produzida: 10, valor_total: 10 }
];

function montarCtx() {
  const ctx = { console: { log() {}, warn() {}, error() {} } };
  vm.createContext(ctx);
  vm.runInContext(
    [
      extrairConst(SRC, '_SP_TZ'),
      extrairFunc(SRC, 'offsetMin'),
      extrairFunc(SRC, 'dataLocalSP'),
      extrairFunc(SRC, '_spAddDiaIso'),
      extrairFunc(SRC, 'inicioDoDiaSP'),
      extrairFunc(SRC, '_spRangeUtc'),
      extrairFunc(SRC, '_relatoriosIsoDateOnly'),
      extrairFunc(SRC, '_relatoriosAddDaysIso'),
      extrairFunc(SRC, '_relatoriosResolveDateRange'),
      'var __captured = [];',
      'var __datasets = {};',
      'function __chain(table){',
      '  var rec = { table: table, ops: [] }; var c = {};',
      '  ["select","not","gte","lt","gt","lte","is","eq","in","ilike","order","limit","range"].forEach(function(n){ c[n] = function(){ rec.ops.push([n].concat(Array.prototype.slice.call(arguments))); return c; }; });',
      '  c.then = function(onF){ __captured.push(rec); var d = __datasets[table] || []; return Promise.resolve({ data: d.slice(), error: null }).then(onF); };',
      '  c.catch = function(){ return c; };',
      '  return c;',
      '}',
      'var supabase = { from: function(t){ return __chain(t); } };',
      'var authMiddleware = function(req, res, next){ if (next) next(); };',
      'var requirePerm = function(){ return function(req, res, next){ if (next) next(); }; };',
      'var setNoCache = function(){};',
      'var _debugRuntimeWrite = function(){};',
      'var _empresaFiltro = function(){ return { todas: true, sigla: "" }; };',
      'var _aplicarFiltroEmpresaOfs = function(q){ return q; };',
      'var _ensureOfsConclusaoMetricasCols = function(){ return Promise.resolve(true); };',
      'var __rota = null;',
      'var app = { get: function(){ __rota = arguments[arguments.length - 1]; } };',
      extrairRota(SRC, ROTA_MARKER),
      'globalThis.__run = function(query, datasets){',
      '  __captured.length = 0; __datasets = datasets || {}; var out = null;',
      '  var res = { status: function(){ return this; }, json: function(p){ out = p; return this; } };',
      '  return __rota({ query: query }, res).then(function(){ return { ops: __captured, res: out }; });',
      '};'
    ].join('\n'),
    ctx
  );
  return ctx;
}

const ctx = montarCtx();
const host = (v) => JSON.parse(JSON.stringify(v));
const opsOf = (captured, tabela) => (captured.find((c) => c.table === tabela) || { ops: [] }).ops;
const achar = (ops, nome, col) => {
  const o = ops.find((x) => x[0] === nome && (col === undefined ? true : String(x[1]) === col));
  return o ? host(o) : undefined;
};

const rodar = (query) => ctx.__run(query, { ofs: OFS });

// ── a query: só concluídas, sem deleted_at, período SP em UTC (F-2) ───────
test('REL-12: a query filtra status concluído e deleted_at is null', async () => {
  const { ops } = await rodar({ mes: '9', ano: '2026' });
  const o = opsOf(ops, 'ofs');
  assert.deepEqual(achar(o, 'ilike', 'status'), ['ilike', 'status', '%conclu%']);
  assert.deepEqual(achar(o, 'is', 'deleted_at'), ['is', 'deleted_at', null]);
  assert.ok(achar(o, 'not', 'data_conclusao'), 'mantém not data_conclusao is null');
});

test('REL-12: o período set/2026 vira instantes UTC de São Paulo (F-2)', async () => {
  const { ops } = await rodar({ mes: '9', ano: '2026' });
  const o = opsOf(ops, 'ofs');
  assert.deepEqual(achar(o, 'gte', 'data_conclusao'), ['gte', 'data_conclusao', '2026-09-01T03:00:00.000Z']);
  assert.deepEqual(achar(o, 'lt', 'data_conclusao'), ['lt', 'data_conclusao', '2026-10-01T03:00:00.000Z']);
});

// ── precedência: tonelada_vendida > toneladas_utilizadas > recálculo ──────
test('REL-12: `tonelada_vendida` tem precedência sobre `toneladas_utilizadas`', async () => {
  const { res } = await rodar({ mes: '9', ano: '2026' });
  const a = res.rows.find((r) => r.id === 'a');
  assert.equal(a.toneladas, 5, 'deve usar tonelada_vendida (5), não toneladas_utilizadas (7)');
});

test('REL-12: sem `tonelada_vendida`, cai em `toneladas_utilizadas`', async () => {
  const { res } = await rodar({ mes: '9', ano: '2026' });
  const b = res.rows.find((r) => r.id === 'b');
  assert.equal(b.toneladas, 3);
});

test('REL-12: sem tonelada persistida, recalcula pela área × gramatura', async () => {
  const { res } = await rodar({ mes: '9', ano: '2026' });
  const c = res.rows.find((r) => r.id === 'c');
  assert.equal(c.area_total_m2, 10);
  assert.equal(c.toneladas, 0.001);
});

test('REL-12: OF sem data_conclusao é descartada', async () => {
  const { res } = await rodar({ mes: '9', ano: '2026' });
  assert.equal(res.rows.length, 3);
  assert.ok(!res.rows.some((r) => r.id === 'd'), 'OF sem data_conclusao não pode entrar');
});

test('REL-12: resposta ecoa o período resolvido', async () => {
  const { res } = await rodar({ mes: '9', ano: '2026' });
  assert.equal(res.ok, true);
  assert.equal(res.data_inicio, '2026-09-01');
  assert.equal(res.data_fim, '2026-09-30');
});

// ── guardas estáticas ─────────────────────────────────────────────────────
test('REL-12: a rota não tem mais o console.log por OF e usa _spRangeUtc', () => {
  const ROTA = extrairRota(SRC, ROTA_MARKER);
  assert.ok(!/\[TONELADAS-FIX\]/.test(ROTA), 'console.log por OF deve ter saído');
  assert.ok(/_tonesRange = range \? _spRangeUtc\(range\.inicio, range\.fim\)/.test(ROTA));
  assert.ok(/tonPersistida > 0 \? tonPersistida : \(tonUtilizada > 0 \? tonUtilizada : tonRecalc\)/.test(ROTA));
});
