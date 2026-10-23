'use strict';
// REL-13 · Lucratividade por máquina: tipo top / cores + rateio da venda.
//
// "Já corrigido na branch; só comprovar." A pendência: `atribuirOfMaquina`
// somava o valor INTEGRO da OF em CADA máquina do fluxo, então o card
// "Valor vendido" do resumo passava do total real de vendas (uma OF que passa
// em 3 máquinas entrava 3x).
// Correção: a venda da OF é RATEADA igualmente entre as máquinas do fluxo, de
// forma que cada OF conta exatamente UMA vez no total. A escolha de rateio (R3)
// permanece como DECISÃO PENDENTE (rateio igual x atribuição só à última).
//
// Roda o código REAL da rota `/api/relatorios/lucratividade-por-maquina` num
// sandbox vm, com `supabase` capturando operações e devolvendo linhas fixas.
// Rodar: node --test tests/aud_rel13_lucratividade_rateio.test.cjs

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

function extrairConstArr(src, nome) {
  const marker = 'const ' + nome + ' = [';
  const i = src.indexOf(marker);
  assert.ok(i >= 0, 'const não encontrada: ' + nome);
  const j = src.indexOf('[', i);
  let d = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === '[') d++;
    else if (src[k] === ']') { d--; if (d === 0) return src.slice(i, k + 2); }
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

const ROTA_MARKER = "app.get('/api/relatorios/lucratividade-por-maquina'";

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
      extrairConstArr(SRC, 'MAQUINAS_CATALOGO_PADRAO'),
      [
        '_normMaqNome', '_canonMaqNome', '_assistNorm', '_caixasParsePerdasPorMaquina',
        '_parseMaybeJsonArray', '_assistPickOfNumber', '_assistPickOfClienteId',
        '_clienteNomeValido', '_relatoriosPickValorOf', '_relatoriosPickQtdOf',
        '_relatoriosPickClienteNomeOf',
      ].map((n) => extrairFunc(SRC, n)).join('\n'),
      'var __captured = [];',
      'var __datasets = {};',
      'function __chain(table){',
      '  var rec = { table: table, ops: [] }; var c = {};',
      '  ["select","not","gte","lt","gt","lte","is","eq","in","ilike","or","order","limit","range"].forEach(function(n){ c[n] = function(){ rec.ops.push([n].concat(Array.prototype.slice.call(arguments))); return c; }; });',
      '  c.then = function(onF){',
      '    __captured.push(rec);',
      '    var d = (__datasets[table] || []).slice();',
      '    if (table === "gramaturas") {',
      '      var inOp = null, eqOp = null;',
      '      rec.ops.forEach(function(o){ if (o[0] === "in") inOp = o; if (o[0] === "eq") eqOp = o; });',
      '      if (inOp && String(inOp[1]) === "id") d = d.filter(function(g){ return inOp[2].indexOf(String(g.id)) >= 0; });',
      '      if (eqOp && String(eqOp[1]) === "id") d = d.filter(function(g){ return String(g.id) === String(eqOp[2]); });',
      '    }',
      '    var r = null; rec.ops.forEach(function(o){ if (o[0] === "range") r = o; });',
      '    if (r) d = d.slice(Number(r[1]), Number(r[2]) + 1);',
      '    return Promise.resolve({ data: d, error: null }).then(onF);',
      '  };',
      '  c.catch = function(){ return c; };',
      '  return c;',
      '}',
      'var supabase = { from: function(t){ return __chain(t); } };',
      'var setNoCache = function(){};',
      // Período determinístico (não depende de new Date()).
      'var _relatoriosResolveDateRange = function(q){',
      '  if (q && String(q.mes) === "9") return { inicio: "2026-09-01", fim: "2026-09-30", fim_exclusivo: "2026-10-01" };',
      '  return null;',
      '};',
      'var _relatoriosResolveEmpresaFilter = function(){ return Promise.resolve({ todas: true, uuid: null, sigla: null }); };',
      'var _relatoriosLoadClientesDetails = function(){ return Promise.resolve(new Map()); };',
      // Período/cancelamento fora do escopo do REL-13.
      'var _vendasOficialDentroDoPeriodo = function(){ return true; };',
      'var _vendasOficialDataRef = function(){ return "2026-09-15"; };',
      'var _assistIsCancelada = function(){ return false; };',
      'var authMiddleware = function(req, res, next){ if (next) next(); };',
      'var __rota = null;',
      'var app = { get: function(){ __rota = arguments[arguments.length - 1]; } };',
      extrairRota(SRC, ROTA_MARKER),
      'globalThis.__run = function(query, datasets){',
      '  __captured.length = 0; __datasets = datasets || {}; var out = null;',
      '  var res = { status: function(){ return this; }, json: function(p){ out = p; return this; } };',
      '  return Promise.resolve(__rota({ query: query }, res)).then(function(){ return { ops: __captured, res: out }; });',
      '};',
    ].join('\n'),
    ctx
  );
  return ctx;
}

const ctx = montarCtx();
const rodar = (ofs) => ctx.__run({ mes: '9', ano: '2026' }, { ofs: ofs || [] });

// OF concluída em 09/2026; por padrão passa em nada (cai em "Sem Máquina Definida").
function ofBase(i, extra) {
  return Object.assign({
    id: 'of' + i,
    numero: String(2000 + i),
    status: 'concluida',
    created_at: '2026-09-10T12:00:00Z',
    empresa_id: ITALY,
    cli_id: 'c1',
    descricao: 'Caixa',
    qtd: 10,
    valor_total: 100,
    tipo_caixa: 'Caixa Americana',
    cores_impressao: ['Preto', 'Azul'],
    passagens_maquina: [],
    perdas_por_maquina: [],
  }, extra || {});
}

const r2 = (v) => Math.round((Number(v) || 0) * 100) / 100;
// Objetos do realm vm têm outro protótipo; normaliza antes de deepEqual.
const host = (v) => JSON.parse(JSON.stringify(v));
const bucketDe = (rows, nome) => rows.find((r) => r.maquina === nome);

// ── garantia REL-13: a soma das máquinas não passa do total real de vendas ──
test('REL-13: "Valor vendido" das máquinas não passa do total real de vendas', async () => {
  const ofs = [
    ofBase(1, { valor_total: 300, passagens_maquina: ['IMP 01', 'IMP 02', 'IMP 03'] }),
    ofBase(2, { valor_total: 100, passagens_maquina: ['IMP 01'] }),
    ofBase(3, { valor_total: 600, passagens_maquina: [] }),
  ];
  const totalReal = 1000;
  const { res } = await rodar(ofs);
  assert.ok(res, 'rota deve responder');
  assert.equal(r2(res.resumo.valor_vendido), totalReal, 'cada OF conta exatamente 1x no total');
  assert.ok(res.resumo.valor_vendido <= totalReal + 1e-6, 'não pode passar do total real');
});

test('REL-13: a OF de 3 máquinas é rateada (300 -> 100 por máquina)', async () => {
  const ofs = [ofBase(1, { valor_total: 300, passagens_maquina: ['IMP 01', 'IMP 02', 'IMP 03'] })];
  const { res } = await rodar(ofs);
  assert.equal(r2(bucketDe(res.rows, 'IMP 01').valor_vendido), 100);
  assert.equal(r2(bucketDe(res.rows, 'IMP 02').valor_vendido), 100);
  assert.equal(r2(bucketDe(res.rows, 'IMP 03').valor_vendido), 100);
});

test('REL-13: OF sem passagem entra INTEIRA em "Sem Máquina Definida"', async () => {
  const ofs = [ofBase(3, { valor_total: 600, passagens_maquina: [] })];
  const { res } = await rodar(ofs);
  assert.equal(r2(bucketDe(res.rows, 'Sem Máquina Definida').valor_vendido), 600);
});

test('REL-13: detalhamento soma o mesmo valor do resumo (sem duplicar)', async () => {
  const ofs = [
    ofBase(1, { valor_total: 300, passagens_maquina: ['IMP 01', 'IMP 02', 'IMP 03'] }),
    ofBase(2, { valor_total: 100, passagens_maquina: ['IMP 01'] }),
    ofBase(3, { valor_total: 600, passagens_maquina: [] }),
  ];
  const { res } = await rodar(ofs);
  const somaDetalhe = res.detail_rows.reduce((a, r) => a + (Number(r.valor_vendido) || 0), 0);
  assert.equal(r2(somaDetalhe), r2(res.resumo.valor_vendido));
  assert.equal(r2(somaDetalhe), 1000);
});

// ── Tipo Top e Cores (parte "já corrigida" que precisa ser comprovada) ──────
test('REL-13: 09/2026 — Tipo Top da máquina com movimento difere de "Sem tipo"', async () => {
  const ofs = [
    ofBase(1, { valor_total: 300, passagens_maquina: ['IMP 01', 'IMP 02', 'IMP 03'], tipo_caixa: 'Caixa Americana' }),
    ofBase(2, { valor_total: 100, passagens_maquina: ['IMP 01'], tipo_caixa: 'Caixa Americana' }),
  ];
  const { res } = await rodar(ofs);
  const imp01 = bucketDe(res.rows, 'IMP 01');
  assert.ok(imp01.tipo_caixa_mais_produzido, 'deve haver tipo top');
  assert.equal(imp01.tipo_caixa_mais_produzido.tipo_caixa, 'Caixa Americana');
  assert.notEqual(imp01.tipo_caixa_mais_produzido.tipo_caixa, 'Sem tipo');
});

test('REL-13: cores mais usadas são canônicas e sem duplicar na mesma OF', async () => {
  const ofs = [
    ofBase(1, { valor_total: 300, passagens_maquina: ['IMP 01', 'IMP 02'], cores_impressao: ['Preto', 'Azul', 'Preto'] }),
  ];
  const { res } = await rodar(ofs);
  const imp01 = bucketDe(res.rows, 'IMP 01');
  const cores = host(imp01.cores_mais_usadas.map((c) => c.cor));
  assert.deepEqual(cores.slice().sort(), ['Azul', 'Preto']);
  const preto = imp01.cores_mais_usadas.find((c) => c.cor === 'Preto');
  assert.equal(preto.total_ofs, 1, 'cor repetida na mesma OF conta 1x');
});

// ── guardas estáticas ─────────────────────────────────────────────────────
test('REL-13: fonte rateia a venda e registra R3 como decisão pendente', () => {
  const ROTA = extrairRota(SRC, ROTA_MARKER);
  assert.ok(/valorOf \/ nMaquinas/.test(ROTA), 'deve ratear a venda da OF');
  assert.ok(/maquinasDoFluxo/.test(ROTA), 'deve listar as máquinas do fluxo antes de ratear');
  assert.ok(/atribuirOfMaquina\(of, canon, maquinasDoFluxo\.length\)/.test(ROTA), 'deve passar o divisor do fluxo');
  assert.ok(!/atribuirOfMaquina\(of, canon, 0\)/.test(ROTA), 'não pode passar divisor 0 (valor inteiro por máquina)');
  assert.ok(/R3/.test(ROTA), 'R3 deve ficar registrado como decisão pendente');
});
