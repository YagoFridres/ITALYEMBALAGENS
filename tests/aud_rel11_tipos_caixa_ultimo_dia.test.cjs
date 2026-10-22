'use strict';
// REL-11 · "Tipos de Caixa" perde o último dia.
//
// Causa: `data_conclusao` é timestamptz e a rota filtrava com `.gte(...,'AAAA-MM-DD')`
// + `.lte(...,'AAAA-MM-DD')`. O `.lte` com data pura vira meia-noite UTC, tornando o
// dia final quase inteiro EXCLUSIVO (perdendo o último dia).
// Correção (F-2): converter o período SP [início, fim] INCLUSIVO para instantes UTC
// (`_spRangeUtc`) e usar `gte`/`lt` (limite superior exclusivo em 00:00 SP do dia seguinte).
//
// Roda o código REAL de server.js: helpers F-2 + a rota `/api/relatorios/tipos-caixa`
// num sandbox vm, com um `supabase` que só CAPTURA as operações (sem banco).
//
// Rodar: node --test tests/aud_rel11_tipos_caixa_ultimo_dia.test.cjs

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
  const fim = src.indexOf('\n', i);
  return src.slice(i, fim);
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
    'var __captured = [];',
    'function __makeChain(table){',
    '  var rec = { table: table, ops: [] }; var c = {};',
    '  ["select","gte","lte","lt","gt","is","eq","in","not","ilike","order","limit","range"].forEach(function(n){ c[n] = function(){ rec.ops.push([n].concat(Array.prototype.slice.call(arguments))); return c; }; });',
    '  c.then = function(onF){ __captured.push(rec); return Promise.resolve({ data: [], error: null }).then(onF); };',
    '  c.catch = function(){ return c; };',
    '  return c;',
    '}',
    'var supabase = { from: function(t){ return __makeChain(t); } };',
    'var authMiddleware = function(req, res, next){ if (next) next(); };',
    'var setNoCache = function(){};',
    'var _empresaFiltro = function(){ return { todas: true, sigla: "" }; };',
    'var _aplicarFiltroEmpresaOfs = function(q){ return q; };',
    'var __rota = null;',
    'var app = { get: function(p, mw, h){ __rota = h; } };',
    extrairRota(SRC, "app.get('/api/relatorios/tipos-caixa'"),
    'globalThis.__run = function(query){',
    '  __captured.length = 0; var out = null;',
    '  var res = { status: function(){ return this; }, json: function(p){ out = p; return this; } };',
    '  return __rota({ query: query }, res).then(function(){ return { ops: __captured, res: out }; });',
    '};'
  ].join('\n'),
  ctx
);

const opsOf = (captured, tabela) => (captured.find((c) => c.table === tabela) || { ops: [] }).ops;
const host = (v) => JSON.parse(JSON.stringify(v));
const achar = (ops, nome, col) => {
  const o = ops.find((x) => x[0] === nome && String(x[1]) === col);
  return o ? host(o) : undefined;
};

// ── F-2 · o período SP vira instantes UTC ─────────────────────────────────
test('REL-11: _spRangeUtc converte set/2026 para instantes UTC (03:00Z)', () => {
  const r = ctx._spRangeUtc('2026-09-01', '2026-09-30');
  assert.deepEqual(JSON.parse(JSON.stringify(r)), {
    gte: '2026-09-01T03:00:00.000Z',
    lt: '2026-10-01T03:00:00.000Z'
  });
});

test('REL-11: o dia 30/09 inteiro está dentro do período (limite exclusivo em 01/10 00:00 SP)', () => {
  const { gte, lt } = ctx._spRangeUtc('2026-09-01', '2026-09-30');
  const lo = new Date(gte).getTime();
  const hi = new Date(lt).getTime();
  const dentro = (iso) => { const t = new Date(iso).getTime(); return t >= lo && t < hi; };
  assert.equal(dentro('2026-09-30T23:59:59-03:00'), true, '23:59:59 de 30/09 SP deve entrar');
  assert.equal(dentro('2026-09-01T00:00:00-03:00'), true, '00:00 de 01/09 SP deve entrar');
  assert.equal(dentro('2026-10-01T00:00:00-03:00'), false, '00:00 de 01/10 SP deve sair');
  assert.equal(dentro('2026-08-31T23:59:59-03:00'), false, '31/08 SP deve sair');
});

// ── a rota real aplica gte/lt (não lte com data pura) ─────────────────────
test('REL-11: rota aplica gte/lt com os instantes UTC do período escolhido', async () => {
  const { ops } = await ctx.__run({ data_inicio: '2026-09-01', data_fim: '2026-09-30' });
  const opsOfs = opsOf(ops, 'ofs');
  assert.deepEqual(achar(opsOfs, 'gte', 'data_conclusao'), ['gte', 'data_conclusao', '2026-09-01T03:00:00.000Z']);
  assert.deepEqual(achar(opsOfs, 'lt', 'data_conclusao'), ['lt', 'data_conclusao', '2026-10-01T03:00:00.000Z']);
  assert.equal(achar(opsOfs, 'lte', 'data_conclusao'), undefined, 'não pode usar lte com data pura');
  assert.ok(achar(opsOfs, 'is', 'deleted_at'), 'mantém o filtro deleted_at is null');
});

test('REL-11: sem parâmetros usa o mês corrente (01→hoje) com gte/lt SP', async () => {
  const { ops, res } = await ctx.__run({});
  const opsOfs = opsOf(ops, 'ofs');
  const ini = res.data_inicio;
  const gte = achar(opsOfs, 'gte', 'data_conclusao');
  const lt = achar(opsOfs, 'lt', 'data_conclusao');
  assert.equal(gte[2], ctx.inicioDoDiaSP(ini));
  assert.equal(lt[2], ctx.inicioDoDiaSP(ctx._spAddDiaIso(res.data_fim, 1)));
  assert.equal(achar(opsOfs, 'lte', 'data_conclusao'), undefined);
});

test('REL-11: resposta ecoa data_inicio/data_fim escolhidos', async () => {
  const { res } = await ctx.__run({ data_inicio: '2026-09-01', data_fim: '2026-09-30' });
  assert.equal(res.data_inicio, '2026-09-01');
  assert.equal(res.data_fim, '2026-09-30');
  assert.equal(res.ok, true);
});

// ── guarda estática ───────────────────────────────────────────────────────
test('REL-11: a rota usa _spRangeUtc no caminho principal (com fallback de data pura)', () => {
  const ROTA = extrairRota(SRC, "app.get('/api/relatorios/tipos-caixa'");
  assert.ok(/_tcRange = _spRangeUtc\(dataInicio, dataFim\)/.test(ROTA), 'deve calcular _tcRange');
  assert.ok(/\.gte\('data_conclusao', _tcRange\.gte\)\.lt\('data_conclusao', _tcRange\.lt\)/.test(ROTA));
});
