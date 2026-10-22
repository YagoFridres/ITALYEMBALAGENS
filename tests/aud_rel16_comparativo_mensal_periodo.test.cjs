'use strict';
// REL-16 · Comparativo Mensal ignorava o período escolhido.
//
// Causa: a rota montava `atual`/`anterior` com `new Date()` (sempre o mês
// corrente) e não lia `req.query`; também fixava as 3 empresas.
// Correção: período via `_relatoriosResolveDateRange(req.query)` (mês corrente
// como padrão) e o anterior de MESMO tamanho; filtro de empresa F-3.
//
// Roda o código REAL da rota `/api/relatorios/comparativo-mensal` num sandbox
// vm, com `_relatoriosFetchOfsConcluidas`/`_relatoriosSummarizeOfs` stubados
// para CAPTURAR o período e os companyIds pedidos (sem banco).
//
// Rodar: node --test tests/aud_rel16_comparativo_mensal_periodo.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8').replace(/\r\n/g, '\n');

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

const ROTA_MARKER = "app.get('/api/relatorios/comparativo-mensal'";

function montarCtx() {
  const ctx = { console: { log() {}, warn() {}, error() {} } };
  vm.createContext(ctx);
  vm.runInContext(
    [
      // período REAL (F-3 range resolver + helpers de data)
      extrairFunc(SRC, '_relatoriosIsoDateOnly'),
      extrairFunc(SRC, '_relatoriosAddDaysIso'),
      extrairFunc(SRC, '_relatoriosMesAnteriorIso'),
      extrairFunc(SRC, '_relatoriosResolveDateRange'),
      'var _RELATORIOS_EMPRESAS_FIXAS = [',
      '  { id: "df5f7672-0a6b-402d-ae65-296554236c31", nome: "Italy" },',
      '  { id: "e9b734dc-c7d5-4b04-898d-1ec7affa721e", nome: "Cartoeste" },',
      '  { id: "a6e5f5d8-4743-4ebe-885e-c2f0741a667a", nome: "Oestepack" }',
      '];',
      'var __fetchCalls = [];',
      // F-3: stub que reflete o filtro por query (e registra a chamada).
      'function _empresaFiltro(req){',
      '  var tok = String((req && req.query && (req.query.emp_id || req.query.empresa_id)) || "").trim().toUpperCase();',
      '  if (!tok || tok === "ALL" || tok === "TODAS") return { todas: true };',
      '  if (tok === "E1" || tok === "ITALY") return { todas: false, uuid: "df5f7672-0a6b-402d-ae65-296554236c31", sigla: "ITALY" };',
      '  return { todas: true };',
      '}',
      'function _relatoriosEmpresaNome(id){ var f = _RELATORIOS_EMPRESAS_FIXAS.find(function(e){ return e.id === id; }); return f ? f.nome : ""; }',
      'function _relatoriosFetchOfsConcluidas(range, opts){ __fetchCalls.push({ range: range, opts: opts }); return Promise.resolve([]); }',
      'function _relatoriosSummarizeOfs(ofs, opts){',
      '  var ids = (opts && opts.companyIds) || [];',
      '  var zero = { valor_vendido: 0, caixas_perdidas: 0, total_ofs: 0, toneladas_vendidas: 0 };',
      '  return { resumo: Object.assign({}, zero), por_empresa: ids.map(function(id){ return Object.assign({ empresa_id: id, empresa_nome: _relatoriosEmpresaNome(id) }, zero); }) };',
      '}',
      'var setNoCache = function(){};',
      'var authMiddleware = function(req, res, next){ if (next) next(); };',
      'var __rota = null;',
      'var app = { get: function(){ __rota = arguments[arguments.length - 1]; } };',
      extrairRota(SRC, ROTA_MARKER),
      'globalThis.__run = function(query){',
      '  __fetchCalls.length = 0; var out = null;',
      '  var res = { status: function(){ return this; }, json: function(p){ out = p; return this; } };',
      '  return Promise.resolve(__rota({ query: query || {} }, res)).then(function(){ return { calls: __fetchCalls.slice(), res: out }; });',
      '};'
    ].join('\n'),
    ctx
  );
  return ctx;
}

const ctx = montarCtx();
const host = (v) => JSON.parse(JSON.stringify(v));
const rodar = (query) => ctx.__run(query);

// ── período escolhido (mes/ano) ───────────────────────────────────────────
test('REL-16: escolher 09/2026 compara setembro × agosto', async () => {
  const { res } = await rodar({ mes: '9', ano: '2026' });
  assert.deepEqual(host(res.periodo_atual), { inicio: '2026-09-01', fim: '2026-09-30' });
  assert.deepEqual(host(res.periodo_anterior), { inicio: '2026-08-01', fim: '2026-08-31' });
});

test('REL-16: as duas buscas usam exatamente os períodos devolvidos', async () => {
  const { calls } = await rodar({ mes: '9', ano: '2026' });
  assert.equal(calls.length, 2);
  assert.deepEqual(host(calls[0].range), { inicio: '2026-09-01', fim: '2026-09-30', fim_exclusivo: '2026-10-01' });
  assert.deepEqual(host(calls[1].range), { inicio: '2026-08-01', fim: '2026-08-31', fim_exclusivo: '2026-09-01' });
});

// ── período anterior de MESMO tamanho (custom) ───────────────────────────
test('REL-16: 01–20/10 compara com 01–20/09 (mesmo número de dias)', async () => {
  const { res } = await rodar({ data_inicio: '2026-10-01', data_fim: '2026-10-20' });
  assert.deepEqual(host(res.periodo_atual), { inicio: '2026-10-01', fim: '2026-10-20' });
  assert.deepEqual(host(res.periodo_anterior), { inicio: '2026-09-01', fim: '2026-09-20' });
});

test('REL-16: mês anterior trata último-dia e dia inexistente', () => {
  assert.equal(ctx._relatoriosMesAnteriorIso('2026-09-30'), '2026-08-31');
  assert.equal(ctx._relatoriosMesAnteriorIso('2026-03-31'), '2026-02-28');
  assert.equal(ctx._relatoriosMesAnteriorIso('2026-01-15'), '2025-12-15');
});

// ── sem filtro: mês corrente × mês anterior (padrão antigo mantido) ──────
test('REL-16: sem query usa o mês corrente como padrão', async () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const mm = String(m).padStart(2, '0');
  const { res } = await rodar({});
  assert.equal(res.periodo_atual.inicio, `${y}-${mm}-01`);
  const prev = m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 };
  assert.equal(res.periodo_anterior.inicio, `${prev.y}-${String(prev.m).padStart(2, '0')}-01`);
});

// ── F-3: filtro de empresa ───────────────────────────────────────────────
test('REL-16: emp_id=E1 restringe as buscas à Italy', async () => {
  const { calls, res } = await rodar({ mes: '9', ano: '2026', emp_id: 'E1' });
  assert.deepEqual(host(calls[0].opts.companyIds), [ITALY]);
  assert.deepEqual(host(calls[1].opts.companyIds), [ITALY]);
  const metricas = res.rows.map((r) => r.metrica);
  assert.ok(metricas.includes('Valor vendido - Italy'), 'deve trazer a linha da Italy');
  assert.ok(!metricas.some((m) => /Cartoeste|Oestepack/.test(m)), 'não deve trazer as outras empresas');
});

test('REL-16: sem emp_id usa as 3 empresas fixas', async () => {
  const { calls } = await rodar({ mes: '9', ano: '2026' });
  assert.equal(calls[0].opts.companyIds.length, 3);
});

// ── guardas estáticas ─────────────────────────────────────────────────────
test('REL-16: a rota lê req.query e não usa mais new Date() no período', () => {
  const ROTA = extrairRota(SRC, ROTA_MARKER);
  assert.ok(/_relatoriosResolveDateRange\(req\.query/.test(ROTA), 'deve resolver o período pela query');
  assert.ok(/_empresaFiltro\(req\)/.test(ROTA), 'deve aplicar F-3');
  assert.ok(!/new Date\(\)/.test(ROTA), 'não pode mais montar o período com new Date()');
});
