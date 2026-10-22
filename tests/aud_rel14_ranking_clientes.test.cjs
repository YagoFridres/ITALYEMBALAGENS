'use strict';
// REL-14 · Ranking de clientes somava OFs não concluídas e cortava em 1000.
//
// Causas: (a) a query de `ofs` não filtrava `status`/`deleted_at` → canceladas e
// excluídas entravam na contagem; (b) usava `.eq('empresa_id', uuid)` direto, o
// que descartava OFs legadas (empresa_id null + emp_id sigla); (c) o `pageSize`
// 10000 do PostgREST devolvia só as 1000 primeiras linhas.
// Correção: `.ilike('status','%conclu%').is('deleted_at',null)` + F-3 + F-4.
//
// Roda o código REAL da rota `/api/clientes/ranking` num sandbox vm, com um
// `supabase` que CAPTURA as operações e devolve linhas fixas (sem banco).
//
// Rodar: node --test tests/aud_rel14_ranking_clientes.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8').replace(/\r\n/g, '\n');
const empresa = require(path.join(ROOT, 'lib', 'empresa.js'));

const ITALY = 'df5f7672-0a6b-402d-ae65-296554236c31';

function extrairFunc(src, nome) {
  const i = src.indexOf('function ' + nome + '(');
  assert.ok(i >= 0, 'função não encontrada: ' + nome);
  const prefixo = src.slice(Math.max(0, i - 6), i) === 'async ' ? 'async ' : '';
  let j = src.indexOf('(', i);
  let d = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === '(') d++;
    else if (src[k] === ')') { d--; if (d === 0) { j = src.indexOf('{', k); break; } }
  }
  d = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (d === 0) return prefixo + src.slice(i, k + 1); }
  }
  throw new Error('fim não achado: ' + nome);
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

const ROTA_MARKER = "app.get('/api/clientes/ranking'";

function montarCtx() {
  const ctx = {
    console: { log() {}, warn() {}, error() {} },
    corrigirUuid: empresa.corrigirUuid,
    _isUuid: empresa.isUuid,
    EMPRESAS_FALLBACK: empresa.EMPRESAS_FALLBACK,
  };
  vm.createContext(ctx);
  vm.runInContext(
    [
      // F-3: funções REAIS que montam o filtro de empresa.
      extrairFunc(SRC, '_empresaSiglaPorUuid'),
      extrairFunc(SRC, '_aplicarFiltroEmpresaOfs'),
      // F-4: paginação REAL (range-aware via stub).
      extrairFunc(SRC, '_fetchTodasPaginas'),
      'var __captured = [];',
      'var __datasets = {};',
      'function __chain(table){',
      '  var rec = { table: table, ops: [] }; var c = {};',
      '  ["select","not","gte","lt","gt","lte","is","eq","in","ilike","or","order","limit","range"].forEach(function(n){ c[n] = function(){ rec.ops.push([n].concat(Array.prototype.slice.call(arguments))); return c; }; });',
      '  c.then = function(onF){',
      '    __captured.push(rec);',
      '    var d = (__datasets[table] || []).slice();',
      '    var r = null; rec.ops.forEach(function(o){ if (o[0] === "range") r = o; });',
      '    if (r) d = d.slice(Number(r[1]), Number(r[2]) + 1);',
      '    return Promise.resolve({ data: d, error: null }).then(onF);',
      '  };',
      '  c.catch = function(){ return c; };',
      '  return c;',
      '}',
      'var supabase = { from: function(t){ return __chain(t); } };',
      'var authMiddleware = function(req, res, next){ if (next) next(); };',
      'var _resolveEmpresaUuid = function(){ return Promise.resolve("' + ITALY + '"); };',
      'var __rota = null;',
      'var app = { get: function(){ __rota = arguments[arguments.length - 1]; } };',
      extrairRota(SRC, ROTA_MARKER),
      'globalThis.__run = function(query, datasets){',
      '  __captured.length = 0; __datasets = datasets || {}; var out = null;',
      '  var res = { status: function(){ return this; }, json: function(p){ out = p; return this; } };',
      '  return Promise.resolve(__rota({ query: query }, res)).then(function(){ return { ops: __captured, res: out }; });',
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

const CLIENTES = [
  { id: 'c1', nome: 'Alpha', cidade: 'SP' },
  { id: 'c2', nome: 'Beta', cidade: 'RJ' },
  { id: 'c3', nome: 'Gama', cidade: 'MG' }
];
const OFS = [
  { cli_id: 'c1', valor_total: 100 },
  { cli_id: 'c1', valor_total: 200 },
  { cli_id: 'c2', valor_venda: 50 },
  { cli_id: 'c3', total: 30 }
];

const rodar = (query, datasets) => ctx.__run(query, datasets || { clientes: CLIENTES, ofs: OFS });

// ── a query: só concluídas, sem deleted_at, filtro único de empresa (F-3) ──
test('REL-14: a query de OFs filtra status concluído e deleted_at is null', async () => {
  const { ops } = await rodar({});
  const o = opsOf(ops, 'ofs');
  assert.deepEqual(achar(o, 'ilike', 'status'), ['ilike', 'status', '%conclu%']);
  assert.deepEqual(achar(o, 'is', 'deleted_at'), ['is', 'deleted_at', null]);
  assert.ok(achar(o, 'not', 'cli_id'), 'mantém not cli_id is null');
});

test('REL-14: a query de OFs usa o filtro único de empresa (F-3), não .eq direto', async () => {
  const { ops } = await rodar({});
  const o = opsOf(ops, 'ofs');
  assert.deepEqual(
    achar(o, 'or'),
    ['or', 'empresa_id.eq.' + ITALY + ',and(empresa_id.is.null,emp_id.eq.ITALY)']
  );
  assert.equal(achar(o, 'eq', 'empresa_id'), undefined, 'não pode restar .eq(empresa_id) na query de OFs');
});

test('REL-14: a query de OFs ordena por created_at', async () => {
  const { ops } = await rodar({});
  const o = opsOf(ops, 'ofs');
  const ord = o.find((x) => x[0] === 'order');
  assert.ok(ord, 'deve ordenar');
  assert.equal(ord[1], 'created_at');
});

// ── agregação == linhas retornadas ────────────────────────────────────────
test('REL-14: o ranking soma apenas as OFs retornadas', async () => {
  const { res } = await rodar({});
  const c1 = res.data.find((r) => r.id === 'c1');
  const c2 = res.data.find((r) => r.id === 'c2');
  const c3 = res.data.find((r) => r.id === 'c3');
  assert.equal(c1.total_ofs, 2);
  assert.equal(c1.faturamento, 300);
  assert.equal(c2.total_ofs, 1);
  assert.equal(c2.faturamento, 50);
  assert.equal(c3.total_ofs, 1);
  assert.equal(c3.faturamento, 30);
});

test('REL-14: ordenação por quantidade coloca quem tem mais OFs primeiro', async () => {
  const { res } = await rodar({ tipo: 'quantidade' });
  assert.deepEqual(host(res.data.map((r) => r.id)), ['c1', 'c2', 'c3']);
});

test('REL-14: ordenação por valor usa o faturamento', async () => {
  const { res } = await rodar({ tipo: 'valor' });
  assert.equal(res.data[0].id, 'c1');
  assert.equal(res.data[0].faturamento, 300);
});

// ── F-4: paginação real de verdade ────────────────────────────────────────
test('REL-14: F-4 pagina além de 1000 OFs (sem corte silencioso)', async () => {
  const ofs = [];
  for (let i = 0; i < 1500; i += 1) ofs.push({ cli_id: 'c1', valor_total: 1 });
  const { res } = await rodar({}, { clientes: CLIENTES, ofs });
  const c1 = res.data.find((r) => r.id === 'c1');
  assert.equal(c1.total_ofs, 1500, 'deve somar as 1500 OFs, não só as 1000 da 1ª página');
  assert.equal(c1.faturamento, 1500);
});

// ── corte final respeita o limit ──────────────────────────────────────────
test('REL-14: o corte final respeita o parâmetro limit', async () => {
  const { res } = await rodar({ limit: '2' });
  assert.equal(res.data.length, 2);
});

// ── guardas estáticas ─────────────────────────────────────────────────────
test('REL-14: a rota não usa mais .eq(empresa_id) na query de OFs e tem os filtros', () => {
  const ROTA = extrairRota(SRC, ROTA_MARKER);
  assert.ok(/\.ilike\('status', '%conclu%'\)/.test(ROTA), 'deve filtrar status concluído');
  assert.ok(/\.is\('deleted_at', null\)/.test(ROTA), 'deve filtrar deleted_at');
  assert.ok(/_aplicarFiltroEmpresaOfs\(qOfs, _rankEmpFiltro\)/.test(ROTA), 'deve aplicar F-3 na query de OFs');
  const blocoOfs = ROTA.slice(ROTA.indexOf("from('ofs')"));
  assert.ok(!/\.eq\('empresa_id'/.test(blocoOfs), 'não pode restar .eq(empresa_id) na query de OFs');
});
