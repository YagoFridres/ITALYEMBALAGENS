'use strict';

/**
 * Testes unitários · numeração segura de OF (P1 · OF Rápida).
 * Dados FICTÍCIOS, sem banco. Rodar: node --test tests/p1_numeracao.test.cjs
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  extrairMaximo,
  coletarTomados,
  proximoNumeroLivre,
  CAMPOS_NEGOCIO,
} = require('../lib/numeracao.js');

test('extrairMaximo pega o maior número em qualquer coluna de negócio', () => {
  const rows = [
    { numero: '4137', of_num: null, of_seq: null, of: null, seq: 900 },
    { numero: null, of_num: '4000', of_seq: null, of: null, seq: 899 },
    { numero: null, of_num: null, of_seq: '1002', of: '1002', seq: 898 },
    { numero: '001', of_num: null, of_seq: null, of: null, seq: 1 },
  ];
  assert.equal(extrairMaximo(rows, CAMPOS_NEGOCIO), 4137);
});

test('extrairMaximo ignora vazios/nulos e devolve 0 quando não há números', () => {
  assert.equal(extrairMaximo([], CAMPOS_NEGOCIO), 0);
  assert.equal(extrairMaximo([{ numero: null, of: '' }], CAMPOS_NEGOCIO), 0);
});

test('coletarTomados monta o conjunto de números já usados', () => {
  const rows = [
    { numero: '4137', of: null },
    { numero: null, of: '4136' },
    { numero: '1000', of: '1000' },
  ];
  const set = coletarTomados(rows, CAMPOS_NEGOCIO);
  assert.ok(set[4137]);
  assert.ok(set[4136]);
  assert.ok(set[1000]);
  assert.equal(set[1001], undefined);
});

test('proximoNumeroLivre = maior+1 quando o topo está livre (não renumera)', () => {
  const set = coletarTomados([{ numero: '4137' }], CAMPOS_NEGOCIO);
  assert.equal(proximoNumeroLivre(4138, set), '4138');
});

test('proximoNumeroLivre pula buracos tomados', () => {
  const set = coletarTomados([{ numero: '4138' }, { numero: '4139' }], CAMPOS_NEGOCIO);
  assert.equal(proximoNumeroLivre(4138, set), '4140');
});

test('proximoNumeroLivre devolve null sem base válida', () => {
  assert.equal(proximoNumeroLivre(0, {}), null);
  assert.equal(proximoNumeroLivre(null, {}), null);
  assert.equal(proximoNumeroLivre(NaN, {}), null);
});

test('concorrência: 10 reservas simultâneas geram 10 números distintos', () => {
  // Simula 10 requisições lendo o mesmo estado inicial (mock do banco).
  const baseRows = [{ numero: '4137' }, { numero: '4136' }];
  const set = coletarTomados(baseRows, CAMPOS_NEGOCIO);
  const base = extrairMaximo(baseRows, CAMPOS_NEGOCIO);
  const reservados = [];
  for (let i = 0; i < 10; i += 1) {
    const cand = proximoNumeroLivre(base + 1, set); // mesma base para todas
    set[cand] = true; // "insert" no mock
    reservados.push(cand);
  }
  assert.equal(new Set(reservados).size, 10, 'números repetidos: ' + reservados.join(','));
  assert.deepEqual(reservados.slice(0, 3), ['4138', '4139', '4140']);
});

test('proximoNumeroLivre sempre devolve string (formato gravado)', () => {
  assert.equal(typeof proximoNumeroLivre(1000, {}), 'string');
});
