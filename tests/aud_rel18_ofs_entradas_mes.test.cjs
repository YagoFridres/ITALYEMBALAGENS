'use strict';
// REL-18 · "OFs que entraram no mês" usava o dia programado e cortava em 10.000.
//
// Causas: (a) `_relatoriosFetchOfsCriadas` filtrava por `dia` (campo que o job
// adia todo dia) em vez de `created_at`; (b) usava `.in('empresa_id', [...])`,
// que descartava OFs legadas (empresa_id null + emp_id sigla); (c) `.limit(10000)`
// do PostgREST devolve no máximo 1000 linhas; (d) não excluía canceladas nem
// `deleted_at`.
// Correção: F-2 (`created_at` em janela UTC de São Paulo) + F-3 + F-4 +
// `.not('status','ilike','%cancel%').is('deleted_at',null)`.
//
// Roda o código REAL da rota `/api/relatorios/ofs-entradas-mes` num sandbox vm.
// Rodar: node --test tests/aud_rel18_ofs_entradas_mes.test.cjs

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

const ROTA_MARKER = "app.get('/api/relatorios/ofs-entradas-mes'";

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
      "const _SP_TZ = 'America/Sao_Paulo';",
      // F-2 REAL: janela em SP -> UTC.
      ['offsetMin', 'dataLocalSP', '_spAddDiaIso', 'inicioDoDiaSP', '_spRangeUtc']
        .map((n) => extrairFunc(SRC, n)).join('\n'),
      // F-3 REAL: filtro de empresa.
      extrairFunc(SRC, '_relatoriosLegacyEmpresaUuid'),
      extrairFunc(SRC, '_relatoriosIsAllCompaniesSentinel'),
      extrairFunc(SRC, '_empresaSiglaPorUuid'),
      extrairFunc(SRC, '_empresaFiltro'),
      extrairFunc(SRC, '_aplicarFiltroEmpresaOfs'),
      // F-4 REAL: paginação.
      extrairFunc(SRC, '_fetchTodasPaginas'),
      // Função sob teste (REAL).
      extrairFunc(SRC, '_relatoriosFetchOfsCriadas'),
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
      'var setNoCache = function(){};',
      // Resolver de período determinístico (evita depender de new Date()).
      'var _relatoriosResolveDateRange = function(q){',
      '  if (q && String(q.mes) === "9") return { inicio: "2026-09-01", fim: "2026-09-30", fim_exclusivo: "2026-10-01" };',
      '  return null;',
      '};',
      'var _assistPickOfClienteId = function(of){ return (of && (of.cli_id || of.cliente_id)) || ""; };',
      'var _assistLoadClientesByIds = function(){ return Promise.resolve(new Map()); };',
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

function ofSetembro(i, extra) {
  return Object.assign({
    id: 'of' + i,
    numero: String(1000 + i),
    status: 'concluida',
    dia: '2026-09-15',
    created_at: '2026-09-10T12:00:00Z',
    empresa_id: ITALY,
    cli_id: 'c1',
    descricao: 'Caixa',
    qtd: 10,
    valor_total: 100
  }, extra || {});
}

const rodar = (query, ofs) => ctx.__run(query || { mes: '9', ano: '2026' }, { ofs: ofs || [ofSetembro(1)] });

// ── F-2: filtra por created_at na janela de São Paulo, não pelo `dia` ──────
test('REL-18: a query usa created_at (janela UTC de SP), não o dia programado', async () => {
  const { ops } = await rodar();
  const o = opsOf(ops, 'ofs');
  assert.deepEqual(achar(o, 'gte', 'created_at'), ['gte', 'created_at', '2026-09-01T03:00:00.000Z']);
  assert.deepEqual(achar(o, 'lt', 'created_at'), ['lt', 'created_at', '2026-10-01T03:00:00.000Z']);
  assert.equal(achar(o, 'gte', 'dia'), undefined, 'não pode filtrar por dia');
  assert.equal(achar(o, 'lt', 'dia'), undefined, 'não pode filtrar por dia');
});

test('REL-18: exclui canceladas e deleted_at', async () => {
  const { ops } = await rodar();
  const o = opsOf(ops, 'ofs');
  assert.deepEqual(achar(o, 'not', 'status'), ['not', 'status', 'ilike', '%cancel%']);
  assert.deepEqual(achar(o, 'is', 'deleted_at'), ['is', 'deleted_at', null]);
});

test('REL-18: F-3 na empresa escolhida (sem .in(empresa_id))', async () => {
  const { ops } = await rodar({ mes: '9', ano: '2026', emp_id: 'E1' });
  const o = opsOf(ops, 'ofs');
  assert.deepEqual(
    achar(o, 'or'),
    ['or', 'empresa_id.eq.' + ITALY + ',and(empresa_id.is.null,emp_id.eq.ITALY)']
  );
  assert.equal(achar(o, 'in', 'empresa_id'), undefined, 'não pode usar .in(empresa_id)');
  assert.equal(achar(o, 'eq', 'empresa_id'), undefined, 'não pode usar .eq(empresa_id)');
});

test('REL-18: Todas as empresas não aplica filtro de empresa', async () => {
  const { ops } = await rodar({ mes: '9', ano: '2026' });
  const o = opsOf(ops, 'ofs');
  assert.equal(achar(o, 'or'), undefined);
  assert.equal(achar(o, 'in', 'empresa_id'), undefined);
  assert.equal(achar(o, 'eq', 'empresa_id'), undefined);
});

// ── F-4: pagina além de 1000 (o antigo corte de 10.000/1000) ───────────────
test('REL-18: F-4 conta as 1500 OFs do mês (sem corte silencioso)', async () => {
  const ofs = [];
  for (let i = 0; i < 1500; i += 1) ofs.push(ofSetembro(i));
  const { res } = await rodar({ mes: '9', ano: '2026' }, ofs);
  assert.equal(res.resumo.total_ofs, 1500);
  assert.equal(res.rows.length, 1500);
});

// ── resumo/valores ────────────────────────────────────────────────────────
test('REL-18: resumo soma OFs, valor e quantidade retornados', async () => {
  const { res } = await rodar({ mes: '9', ano: '2026' }, [
    ofSetembro(1, { valor_total: 422.5, qtd: 10 }),
    ofSetembro(2, { valor_total: 100, qtd: 5 })
  ]);
  assert.equal(res.resumo.total_ofs, 2);
  assert.equal(Math.round(res.resumo.valor_total * 100) / 100, 522.5);
  assert.equal(res.resumo.quantidade_total, 15);
  assert.equal(res.ano, 2026);
  assert.equal(res.mes, 9);
});

// ── guardas estáticas ─────────────────────────────────────────────────────
test('REL-18: fonte usa F-2/F-3/F-4 e não usa dia/limit(10000)', () => {
  const BLOCO = extrairFunc(SRC, '_relatoriosFetchOfsCriadas');
  assert.ok(/_spRangeUtc\(range\.inicio, range\.fim\)/.test(BLOCO), 'deve montar a janela com F-2');
  assert.ok(/\.gte\('created_at'/.test(BLOCO), 'deve filtrar created_at');
  assert.ok(/\.not\('status', 'ilike', '%cancel%'\)/.test(BLOCO), 'deve excluir canceladas');
  assert.ok(/\.is\('deleted_at', null\)/.test(BLOCO), 'deve excluir deleted_at');
  assert.ok(/_aplicarFiltroEmpresaOfs\(query, filtroEmp\)/.test(BLOCO), 'deve aplicar F-3');
  assert.ok(/_fetchTodasPaginas\(/.test(BLOCO), 'deve paginar com F-4');
  assert.ok(!/\.in\('empresa_id'/.test(BLOCO), 'não pode usar .in(empresa_id)');
  assert.ok(!/limit\(10000\)/.test(BLOCO), 'não pode manter o corte de 10000');
  const ROTA = extrairRota(SRC, ROTA_MARKER);
  assert.ok(/empresaFiltro: filtroEmp/.test(ROTA), 'rota deve passar empresaFiltro (F-3)');
  assert.ok(!/companyIds/.test(ROTA), 'rota não deve mais passar companyIds');
});
