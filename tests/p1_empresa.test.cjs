'use strict';
// P1 · Testes unitários do normalizador de empresa (dados fictícios, sem banco).
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizarEmpresa,
  corrigirUuid,
  isUuid,
  UUID_OESTEPACK_ERRADO,
  UUID_OESTEPACK_CORRETO,
  EMPRESAS_FALLBACK,
} = require('../lib/empresa.js');

const ITALY = 'df5f7672-0a6b-402d-ae65-296554236c31';
const CARTO = 'e9b734dc-c7d5-4b04-898d-1ec7affa721e';
const OESTE = UUID_OESTEPACK_CORRETO;

// Tabela `empresas` fictícia (mesmo formato do Supabase).
const EMPRESAS_ROWS = [
  { id: ITALY, nome: 'Italy Embalagens', sigla: 'ITALY', codigo: 'E1' },
  { id: CARTO, nome: 'Cartoeste', sigla: 'CARTO', codigo: 'E2' },
  { id: OESTE, nome: 'Oestepack', sigla: 'OESTE', codigo: 'E3' },
];

test('UUID válido presente em empresas resolve para o próprio UUID', () => {
  const r = normalizarEmpresa({ empresa_id: CARTO }, EMPRESAS_ROWS);
  assert.equal(r.erro, undefined);
  assert.equal(r.empresa_id, CARTO);
  assert.equal(r.emp_id, 'E2');
});

test('código E1/E2/E3 é traduzido para o UUID correto', () => {
  assert.deepEqual(
    { id: normalizarEmpresa({ empresa_id: 'E1' }, EMPRESAS_ROWS).empresa_id, emp: normalizarEmpresa({ empresa_id: 'E1' }, EMPRESAS_ROWS).emp_id },
    { id: ITALY, emp: 'E1' }
  );
  assert.equal(normalizarEmpresa({ empresa_id: 'E2' }, EMPRESAS_ROWS).empresa_id, CARTO);
  assert.equal(normalizarEmpresa({ empresa_id: 'E3' }, EMPRESAS_ROWS).empresa_id, OESTE);
});

test('sigla ITALY/CARTO/OESTE é traduzida para o UUID correto', () => {
  assert.equal(normalizarEmpresa({ emp_id: 'ITALY' }, EMPRESAS_ROWS).empresa_id, ITALY);
  assert.equal(normalizarEmpresa({ emp_id: 'CARTO' }, EMPRESAS_ROWS).empresa_id, CARTO);
  assert.equal(normalizarEmpresa({ emp_id: 'OESTE' }, EMPRESAS_ROWS).empresa_id, OESTE);
});

test('UUID da Oestepack com erro de digitação é corrigido', () => {
  const r = normalizarEmpresa({ empresa_id: UUID_OESTEPACK_ERRADO }, EMPRESAS_ROWS);
  assert.equal(r.erro, undefined);
  assert.equal(r.empresa_id, OESTE);
  assert.equal(r.emp_id, 'E3');
  assert.notEqual(UUID_OESTEPACK_ERRADO, OESTE);
  assert.equal(corrigirUuid(UUID_OESTEPACK_ERRADO), OESTE);
  assert.equal(isUuid(OESTE), true);
  // variante de 35 chars (sem o "a" final) também é corrigida
  assert.equal(corrigirUuid('a6e5f5d8-4743-4ebe-885e-c2f0741a667'), OESTE);
});

test('valor inválido retorna erro', () => {
  assert.equal(normalizarEmpresa({ empresa_id: 'XYZ' }, EMPRESAS_ROWS).erro, 'empresa_invalida');
  assert.equal(normalizarEmpresa({ empresa_id: 'a6e5f5d8-0000-0000-0000-000000000000' }, EMPRESAS_ROWS).erro, 'empresa_invalida');
});

test('conflito entre empresa_id e emp_id retorna erro', () => {
  const r = normalizarEmpresa({ empresa_id: 'E1', emp_id: 'E2' }, EMPRESAS_ROWS);
  assert.equal(r.erro, 'conflito_empresa');
});

test('sem empresa informada retorna empresa_obrigatoria', () => {
  assert.equal(normalizarEmpresa({}, EMPRESAS_ROWS).erro, 'empresa_obrigatoria');
  assert.equal(normalizarEmpresa({ empresa_id: '  ' }, EMPRESAS_ROWS).erro, 'empresa_obrigatoria');
});

test('empresa_id e emp_id coerentes (mesmo UUID) são aceitos', () => {
  const r = normalizarEmpresa({ empresa_id: CARTO, emp_id: 'E2' }, EMPRESAS_ROWS);
  assert.equal(r.erro, undefined);
  assert.equal(r.empresa_id, CARTO);
  assert.equal(r.emp_id, 'E2');
});

test('tabela empresas indisponível usa o mapa canônico de fallback', () => {
  const r = normalizarEmpresa({ empresa_id: 'E3' }, []);
  assert.equal(r.erro, undefined);
  assert.equal(r.empresa_id, OESTE);
  assert.equal(r.emp_id, 'E3');
  assert.equal(EMPRESAS_FALLBACK.length, 3);
});

test('tabela indisponível rejeita UUID desconhecido', () => {
  const r = normalizarEmpresa({ empresa_id: '11111111-2222-4333-8444-555555555555' }, []);
  assert.ok(r.erro, 'deve retornar erro para UUID desconhecido sem tabela');
});
