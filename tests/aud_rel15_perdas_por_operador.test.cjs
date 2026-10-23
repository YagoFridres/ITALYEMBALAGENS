'use strict';
// REL-15 · Perdas por operador escondia os registros com `emp_id` NULO.
//
// Causa: em `/api/perdas/por-operador` o filtro por empresa usava
// `q.in('emp_id', [uuid, sigla])`, que descarta qualquer linha cujo `emp_id`
// seja NULL (lançamentos legados/antigos). A inconformidade fica invisível.
// Correção: `or(emp_id.in.(uuid,sigla),emp_id.is.null)` — segue isolando as
// outras empresas e passa a incluir os registros sem empresa.
//
// Roda o código REAL da rota `/api/perdas/por-operador` num sandbox vm, com um
// `supabase` que CAPTURA as operações e aplica o filtro sobre linhas fixas.
// Rodar: node --test tests/aud_rel15_perdas_por_operador.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8').replace(/\r\n/g, '\n');

const ITALY = 'df5f7672-0a6b-402d-ae65-296554236c31';

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

const ROTA_MARKER = "app.get('/api/perdas/por-operador'";

function montarCtx() {
  const ctx = { console: { log() {}, warn() {}, error() {} } };
  vm.createContext(ctx);
  vm.runInContext(
    [
      'var __captured = [];',
      'var __datasets = {};',
      // Divide uma expressão OR do PostgREST por vírgulas de TOPO (ignora as
      // que estão dentro de parênteses, ex.: emp_id.in.(a,b)).
      'function __splitOr(expr){',
      '  var out = [], cur = "", depth = 0;',
      '  for (var i = 0; i < expr.length; i++) {',
      '    var ch = expr[i];',
      '    if (ch === "(") depth++;',
      '    if (ch === ")") depth--;',
      '    if (ch === "," && depth === 0) { out.push(cur); cur = ""; continue; }',
      '    cur += ch;',
      '  }',
      '  if (cur) out.push(cur);',
      '  return out;',
      '}',
      'function __reduz(rec, d){',
      '  rec.ops.forEach(function(o){',
      '    var name = o[0];',
      '    if (name === "in") d = d.filter(function(row){ return o[2].map(String).indexOf(String(row[o[1]])) >= 0; });',
      '    else if (name === "or") {',
      '      var clauses = __splitOr(String(o[1]));',
      '      d = d.filter(function(row){',
      '        return clauses.some(function(cl){',
      '          var m = cl.match(/^\\s*([a-z0-9_]+)\\.in\\.\\(([^)]*)\\)\\s*$/i);',
      '          if (m) { var vals = m[2].split(",").map(function(s){ return s.trim(); }); return vals.indexOf(String(row[m[1]])) >= 0; }',
      '          var m2 = cl.match(/^\\s*([a-z0-9_]+)\\.is\\.null\\s*$/i);',
      '          if (m2) return row[m2[1]] == null;',
      '          return false;',
      '        });',
      '      });',
      '    }',
      '    else if (name === "eq") { d = d.filter(function(row){ return String(row[o[1]]) === String(o[2]); }); }',
      '    else if (name === "is") { d = d.filter(function(row){ return (String(o[2]) === "null" || o[2] === null) ? row[o[1]] == null : true; }); }',
      '  });',
      '  var lim = null; rec.ops.forEach(function(o){ if (o[0] === "limit") lim = o; });',
      '  if (lim) d = d.slice(0, Number(lim[1]));',
      '  return d;',
      '}',
      'function __chain(table){',
      '  var rec = { table: table, ops: [] }; var c = {};',
      '  ["select","not","gte","lt","gt","lte","is","eq","in","ilike","or","order","limit","range"].forEach(function(n){ c[n] = function(){ rec.ops.push([n].concat(Array.prototype.slice.call(arguments))); return c; }; });',
      '  c.then = function(onF){',
      '    __captured.push(rec);',
      '    var d = __reduz(rec, (__datasets[table] || []).slice());',
      '    return Promise.resolve({ data: d, error: null }).then(onF);',
      '  };',
      '  c.catch = function(){ return c; };',
      '  return c;',
      '}',
      'var supabase = { from: function(t){ return __chain(t); } };',
      'var authMiddleware = function(req, res, next){ if (next) next(); };',
      'var _resolveEmpresaUuid = function(){ return Promise.resolve(__empresaUuid || ""); };',
      'var __empresaUuid = "";',
      'var __rota = null;',
      'var app = { get: function(){ __rota = arguments[arguments.length - 1]; } };',
      extrairRota(SRC, ROTA_MARKER),
      'globalThis.__run = function(query, datasets, empresaUuid){',
      '  __captured.length = 0; __datasets = datasets || {}; __empresaUuid = empresaUuid || ""; var out = null;',
      '  var res = { status: function(){ return this; }, json: function(p){ out = p; return this; } };',
      '  return Promise.resolve(__rota({ query: query || {} }, res)).then(function(){ return { ops: __captured, res: out }; });',
      '};',
    ].join('\n'),
    ctx
  );
  return ctx;
}

const ctx = montarCtx();
const host = (v) => JSON.parse(JSON.stringify(v));

// 09/06: Joao (ITALY), Maria (emp_id NULO, legado) e Zeca (OUTRA empresa).
const inconformidades = [
  { operador: 'Joao', qtd_perdida: 5, created_at: '2026-09-06T10:00:00Z', emp_id: ITALY },
  { operador: 'Maria', qtd_perdida: 3, created_at: '2026-09-06T11:00:00Z', emp_id: null },
  { operador: 'Zeca', qtd_perdida: 9, created_at: '2026-09-06T12:00:00Z', emp_id: 'OUTRA-EMPRESA' },
];

const rodar = (query) => ctx.__run(query || { empId: 'E1' }, { inconformidades }, ITALY);

const opsOf = (captured, tabela) => (captured.find((c) => c.table === tabela) || { ops: [] }).ops;
const achar = (ops, nome, col) => {
  const o = ops.find((x) => x[0] === nome && (col === undefined ? true : String(x[1]) === col));
  return o ? host(o) : undefined;
};

// ── a inconformidade de emp_id NULO aparece ──────────────────────────────
test('REL-15: o registro de 09/06 com emp_id nulo aparece no ranking', async () => {
  const { res } = await rodar();
  assert.ok(res && res.ok, 'rota deve responder ok');
  const nomes = res.ranking.map((r) => r.nome);
  assert.ok(nomes.includes('Maria'), 'operador do registro com emp_id NULO deve aparecer');
  assert.ok(nomes.includes('Joao'), 'operador da própria empresa deve aparecer');
  assert.ok(!nomes.includes('Zeca'), 'outra empresa deve continuar fora');
});

test('REL-15: a query usa OR com emp_id.is.null (não o filtro por lista)', async () => {
  const { ops } = await rodar();
  const o = opsOf(ops, 'inconformidades');
  const or = achar(o, 'or');
  assert.ok(or, 'deve aplicar .or(...)');
  assert.equal(or[1], 'emp_id.in.(' + ITALY + ',E1),emp_id.is.null');
  assert.equal(achar(o, 'in', 'emp_id'), undefined, 'não pode filtrar emp_id por lista');
});

test('REL-15: sem empresa resolvida não aplica filtro de emp_id', async () => {
  const { ops } = await ctx.__run({}, { inconformidades }, '');
  const o = opsOf(ops, 'inconformidades');
  assert.equal(achar(o, 'or'), undefined);
  assert.equal(achar(o, 'in', 'emp_id'), undefined);
});

test('REL-15: ranking soma as perdas do período e ordena desc', async () => {
  const { res } = await rodar();
  assert.equal(res.ranking.length, 2);
  assert.equal(res.ranking[0].nome, 'Joao');
  assert.equal(res.ranking[0].total, 5);
  const maria = res.ranking.find((r) => r.nome === 'Maria');
  assert.equal(maria.total, 3);
  assert.equal(maria.registros, 1);
});

// ── guardas estáticas ─────────────────────────────────────────────────────
test('REL-15: fonte usa emp_id.in.(...) + emp_id.is.null', () => {
  const ROTA = extrairRota(SRC, ROTA_MARKER);
  assert.ok(/emp_id\.in\.\(\$\{_empIdsInc\.join\(','\)\}\)/.test(ROTA), 'deve montar o in(...) do PostgREST');
  assert.ok(/emp_id\.is\.null/.test(ROTA), 'deve incluir emp_id.is.null');
  assert.ok(!/\.in\('emp_id'/.test(ROTA), 'não pode manter o filtro por lista de emp_id');
});
