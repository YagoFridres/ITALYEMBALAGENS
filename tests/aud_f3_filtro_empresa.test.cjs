'use strict';
// F-3 · Filtro de empresa único (_empresaFiltro / _aplicarFiltroEmpresaOfs /
// _empresaDaOf). As funções são extraídas de server.js e rodam num contexto vm
// com module de lib/empresa injetado — sem tocar em banco.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const server = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const empresa = require(path.join(ROOT, 'lib', 'empresa.js'));

const ITALY = 'df5f7672-0a6b-402d-ae65-296554236c31';
const CARTO = 'e9b734dc-c7d5-4b04-898d-1ec7affa721e';
const OESTE = 'a6e5f5d8-4743-4ebe-885e-c2f0741a667a';
const OESTE_ERRADO = 'a6e5f5d8-4743-4ebe-885e-c2f0f741a667';

function extrair(src, nome) {
  const i = src.indexOf('function ' + nome + '(');
  assert.ok(i >= 0, 'função não encontrada: ' + nome);
  const prefixo = src.slice(Math.max(0, i - 6), i) === 'async ' ? 'async ' : '';
  let d = 0;
  const j = src.indexOf('{', i);
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (d === 0) return prefixo + src.slice(i, k + 1); }
  }
  throw new Error('fim não achado: ' + nome);
}

const ctx = {
  console,
  corrigirUuid: empresa.corrigirUuid,
  EMPRESAS_FALLBACK: empresa.EMPRESAS_FALLBACK,
};
vm.createContext(ctx);
vm.runInContext(
  ['_relatoriosIsAllCompaniesSentinel', '_isUuid', '_relatoriosLegacyEmpresaUuid',
    '_empresaSiglaPorUuid', '_empresaFiltro', '_aplicarFiltroEmpresaOfs', '_empresaDaOf']
    .map((n) => extrair(server, n)).join('\n'),
  ctx
);

// Objetos devolvidos pelo contexto vm têm outro protótipo (outro realm);
// normaliza antes de comparar com deepStrictEqual.
const plain = (v) => JSON.parse(JSON.stringify(v));
const filtro = (req) => plain(ctx._empresaFiltro(req));

// ── _empresaFiltro: as 4 formas de entrada ────────────────────────────────
const FORMAS = [
  ['query.emp_id', { query: { emp_id: 'E1' } }],
  ['query.empresa_id', { query: { empresa_id: 'E1' } }],
  ['body.empId', { body: { empId: 'E1' } }],
  ['body.empresaId', { body: { empresaId: 'E1' } }],
];
for (const [nome, req] of FORMAS) {
  test('F-3: ' + nome + " = 'E1' -> ITALY", () => {
    assert.deepStrictEqual(filtro(req), { todas: false, uuid: ITALY, sigla: 'ITALY' });
  });
}

test("F-3: UUID correto de cada empresa resolve pela sigla", () => {
  assert.strictEqual(ctx._empresaFiltro({ query: { emp_id: ITALY } }).sigla, 'ITALY');
  assert.strictEqual(ctx._empresaFiltro({ query: { emp_id: CARTO } }).sigla, 'CARTO');
  assert.strictEqual(ctx._empresaFiltro({ query: { emp_id: OESTE } }).sigla, 'OESTE');
});

test("F-3: 'todas_empresas' / sentinelas / vazio -> { todas: true }", () => {
  assert.deepStrictEqual(filtro({ query: { todas_empresas: '1' } }), { todas: true });
  assert.deepStrictEqual(filtro({ query: { emp_id: 'todas' } }), { todas: true });
  assert.deepStrictEqual(filtro({ query: { emp_id: 'all' } }), { todas: true });
  assert.deepStrictEqual(filtro({ query: {} }), { todas: true });
  assert.deepStrictEqual(filtro({ query: { emp_id: 'E9' } }), { todas: true });
});

test("F-3: siglas legadas E2/E3 -> CARTO/OESTE", () => {
  assert.deepStrictEqual(filtro({ query: { emp_id: 'E2' } }), { todas: false, uuid: CARTO, sigla: 'CARTO' });
  assert.deepStrictEqual(filtro({ query: { emp_id: 'E3' } }), { todas: false, uuid: OESTE, sigla: 'OESTE' });
});

// ── _aplicarFiltroEmpresaOfs ──────────────────────────────────────────────
function qStub() {
  const chamadas = [];
  return {
    chamadas,
    eq: (c, v) => { chamadas.push(['eq', c, v]); return 'EQ'; },
    or: (s) => { chamadas.push(['or', s]); return 'OR'; },
  };
}

test('F-3: filtro { todas:true } não altera a query', () => {
  const q = qStub();
  assert.strictEqual(ctx._aplicarFiltroEmpresaOfs(q, { todas: true }), q);
  assert.strictEqual(q.chamadas.length, 0);
});

test('F-3: com sigla aplica or(empresa_id.uuid, emp_id.sigla)', () => {
  const q = qStub();
  ctx._aplicarFiltroEmpresaOfs(q, { todas: false, uuid: OESTE, sigla: 'OESTE' });
  assert.deepStrictEqual(q.chamadas, [['or', 'empresa_id.eq.' + OESTE + ',and(empresa_id.is.null,emp_id.eq.OESTE)']]);
});

test('F-3: sem sigla (UUID desconhecido) cai no eq(empresa_id)', () => {
  const q = qStub();
  ctx._aplicarFiltroEmpresaOfs(q, { todas: false, uuid: ITALY, sigla: '' });
  assert.deepStrictEqual(q.chamadas, [['eq', 'empresa_id', ITALY]]);
});

// ── _empresaDaOf ──────────────────────────────────────────────────────────
test('F-3: OF com UUID errado da Oestepack -> E3 (corrigeUuid)', () => {
  assert.strictEqual(ctx._empresaDaOf({ empresa_id: OESTE_ERRADO }), OESTE);
});

test("F-3: OF com empresa_id nulo e emp_id='E1' -> Italy", () => {
  assert.strictEqual(ctx._empresaDaOf({ empresa_id: null, emp_id: 'E1' }), ITALY);
  assert.strictEqual(ctx._empresaDaOf({ emp_id: 'E1' }), ITALY);
});

test('F-3: OF com empresa_id válido passa direto', () => {
  assert.strictEqual(ctx._empresaDaOf({ empresa_id: CARTO }), CARTO);
});
