'use strict';
// REL-01 · Oestepack perdia OFs por UUID errado.
// Parte das OFs foi gravada com VARIANTES QUEBRADAS do UUID da Oestepack; os
// relatórios por empresa as descartavam (setembro: 713 OFs em vez de 749).
//
// Roda as funções REAIS de server.js num sandbox vm (sem banco) e confere que
// o UUID errado é corrigido (F-3/_empresaDaOf) e que a classificação por
// empresa cai em emp_id quando o UUID é desconhecido.
//
// Rodar: node --test tests/aud_rel01_empresa_uuid.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8').replace(/\r\n/g, '\n');
const empresa = require(path.join(ROOT, 'lib', 'empresa.js'));

const ITALY = 'df5f7672-0a6b-402d-ae65-296554236c31';
const CARTO = 'e9b734dc-c7d5-4b04-898d-1ec7affa721e';
const OESTE = 'a6e5f5d8-4743-4ebe-885e-c2f0741a667a';
// Variantes quebradas (lib/empresa.js · UUID_VARIANTES_QUEBRADAS)
const ERR_0F741 = 'a6e5f5d8-4743-4ebe-885e-c2f0f741a667';
const ERR_SEM_A = 'a6e5f5d8-4743-4ebe-885e-c2f0741a667';
const ERR_37 = 'a6e5f5d8-4743-4ebe-885e-c2f0f741a667a';
// UUID válido porém NÃO pertencente a nenhuma das três empresas (nem variante
// quebrada conhecida): é o caso em que a classificação tem de cair no emp_id.
const DESCONHECIDO = '11111111-1111-4111-8111-111111111111';

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

function extrairConst(src, nome) {
  const i = src.indexOf('const ' + nome + ' =');
  assert.ok(i >= 0, 'const não encontrada: ' + nome);
  const fim = src.indexOf('\n', i);
  return src.slice(i, fim);
}

const ctx = {
  console: { log() {}, warn() {}, error() {} },
  corrigirUuid: empresa.corrigirUuid,
  _isUuid: empresa.isUuid,
  EMPRESAS_FALLBACK: empresa.EMPRESAS_FALLBACK,
};
vm.createContext(ctx);
vm.runInContext(
  [
    extrairConst(SRC, '_JJ3_U1'),
    extrairConst(SRC, '_JJ3_U2'),
    extrairConst(SRC, '_JJ3_U3'),
    extrairFunc(SRC, '_relatoriosLegacyEmpresaUuid'),
    extrairFunc(SRC, '_empresaDaOf'),
    extrairFunc(SRC, '_relatoriosPickEmpresaId'),
    extrairFunc(SRC, '_jj3ClassificaEmpresa'),
  ].join('\n'),
  ctx
);

// ── _relatoriosPickEmpresaId (F-3) ────────────────────────────────────────
test('REL-01: UUID errado da Oestepack conta como Oestepack', () => {
  assert.strictEqual(ctx._relatoriosPickEmpresaId({ empresa_id: ERR_0F741 }), OESTE);
  assert.strictEqual(ctx._relatoriosPickEmpresaId({ empresa_id: ERR_SEM_A }), OESTE);
});

test('REL-01: variante de 37 caracteres (inválida) resolve por emp_id=E3', () => {
  assert.strictEqual(ctx._relatoriosPickEmpresaId({ empresa_id: ERR_37, emp_id: 'E3' }), OESTE);
});

test('REL-01: sem empresa_id, usa a sigla emp_id', () => {
  assert.strictEqual(ctx._relatoriosPickEmpresaId({ empresa_id: '', emp_id: 'E3' }), OESTE);
  assert.strictEqual(ctx._relatoriosPickEmpresaId({ empresa_id: '', emp_id: 'E1' }), ITALY);
  assert.strictEqual(ctx._relatoriosPickEmpresaId({ empresa_id: '', emp_id: 'E2' }), CARTO);
});

test('REL-01: UUIDs corretos passam direto', () => {
  assert.strictEqual(ctx._relatoriosPickEmpresaId({ empresa_id: ITALY }), ITALY);
  assert.strictEqual(ctx._relatoriosPickEmpresaId({ empresa_id: OESTE }), OESTE);
});

// ── _jj3ClassificaEmpresa ─────────────────────────────────────────────────
test('REL-01: classificação do UUID errado cai em U3 (Oestepack)', () => {
  assert.strictEqual(ctx._jj3ClassificaEmpresa({ empresa_id: ERR_0F741, emp_id: 'E3' }), 'U3');
  assert.strictEqual(ctx._jj3ClassificaEmpresa({ empresa_id: ERR_SEM_A, emp_id: 'E3' }), 'U3');
  assert.strictEqual(ctx._jj3ClassificaEmpresa({ empresa_id: ERR_37, emp_id: 'E3' }), 'U3');
});

test('REL-01: UUID desconhecido usa emp_id (E1/E2/E3)', () => {
  assert.strictEqual(ctx._jj3ClassificaEmpresa({ empresa_id: DESCONHECIDO, emp_id: 'E1' }), 'U1');
  assert.strictEqual(ctx._jj3ClassificaEmpresa({ empresa_id: DESCONHECIDO, emp_id: 'E2' }), 'U2');
  assert.strictEqual(ctx._jj3ClassificaEmpresa({ empresa_id: '', emp_id: 'E3' }), 'U3');
  assert.strictEqual(ctx._jj3ClassificaEmpresa({ empresa_id: '', emp_id: 'E2' }), 'U2');
});

test('REL-01: sem empresa nenhuma continua SEM', () => {
  assert.strictEqual(ctx._jj3ClassificaEmpresa({ empresa_id: '', emp_id: '' }), 'SEM');
  assert.strictEqual(ctx._jj3ClassificaEmpresa({}), 'SEM');
});

test('REL-01: UUIDs corretos continuam classificando U1/U2/U3', () => {
  assert.strictEqual(ctx._jj3ClassificaEmpresa({ empresa_id: ITALY }), 'U1');
  assert.strictEqual(ctx._jj3ClassificaEmpresa({ empresa_id: CARTO }), 'U2');
  assert.strictEqual(ctx._jj3ClassificaEmpresa({ empresa_id: OESTE }), 'U3');
});

// ── Integridade: nenhuma das 39 OFs fica sem empresa ──────────────────────
test('REL-01: OFs com variante quebrada+emp_id entram em alguma empresa (sem OUTRA)', () => {
  const amostra = [
    { empresa_id: ERR_0F741, emp_id: 'E3' },
    { empresa_id: ERR_SEM_A, emp_id: 'E3' },
    { empresa_id: ERR_37, emp_id: 'E3' },
    // Uma das 3 OFs que a migração D1 deixa para decisão: UUID quebrado da
    // Oestepack com emp_id E1. A classificação segue o UUID corrigido (U3) —
    // é justamente por isso que a D1 não as altera sozinha.
    { empresa_id: ERR_0F741, emp_id: 'E1' },
    { empresa_id: DESCONHECIDO, emp_id: 'E2' },
  ];
  const buckets = amostra.map((of) => ctx._jj3ClassificaEmpresa(of));
  assert.deepStrictEqual(buckets, ['U3', 'U3', 'U3', 'U3', 'U2']);
  assert.ok(buckets.every((b) => b === 'U1' || b === 'U2' || b === 'U3'));
});

// ── Guarda estática ───────────────────────────────────────────────────────
test('REL-01: _relatoriosPickEmpresaId delega para _empresaDaOf (F-3)', () => {
  const i = SRC.indexOf('function _relatoriosPickEmpresaId(');
  const fim = SRC.indexOf('function _relatoriosPickValorOf(', i);
  const bloco = SRC.slice(i, fim);
  assert.ok(bloco.includes('return _empresaDaOf(of)'), 'deve delegar para _empresaDaOf');
  assert.ok(!bloco.includes('_isUuid(uuid)'), 'não pode voltar a aceitar o UUID errado direto');
});

test('REL-01: migração D1_uuid_oestepack.sql existe em migrations/pendentes', () => {
  const p = path.join(ROOT, 'migrations', 'pendentes', 'D1_uuid_oestepack.sql');
  assert.ok(fs.existsSync(p), 'a migração proposta deve existir');
  const sql = fs.readFileSync(p, 'utf8');
  assert.ok(sql.includes('NÃO EXECUTAR'), 'deve avisar que não é para executar');
  assert.ok(sql.includes('ROLLBACK'), 'deve ter ROLLBACK explícito');
  assert.ok(sql.includes('a6e5f5d8-4743-4ebe-885e-c2f0741a667a'), 'deve usar o UUID correto da Oestepack');
});
