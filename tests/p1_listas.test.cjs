'use strict';

/**
 * Testes unitários · listas limpas da OF Rápida (P1 · Commit 4).
 * Carrega a IIFE `patchListasLimpasP1` do patch.js em um sandbox sem DOM e
 * valida APENAS os construtores puros (máquinas, vendedores, clientes).
 * Dados FICTÍCIOS, sem banco. Rodar: node --test tests/p1_listas.test.cjs
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function carregarApi() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'patch.js'), 'utf8');
  const marker = '(function patchListasLimpasP1() {';
  const idx = src.indexOf(marker);
  assert.ok(idx > 0, 'IIFE patchListasLimpasP1 não encontrada em patch.js');
  const code = src.slice(idx); // a IIFE é o último bloco do arquivo

  const noop = () => {};
  const sandbox = {
    document: {
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      documentElement: {},
      addEventListener: noop,
      readyState: 'complete',
    },
    MutationObserver: function () { this.observe = noop; this.disconnect = noop; },
    setTimeout: noop,
    clearTimeout: noop,
    console,
  };
  sandbox.window = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  const api = sandbox.__p1Listas;
  assert.ok(api && typeof api === 'object', 'window.__p1Listas não foi exposto');
  return api;
}

const api = carregarApi();
const arr = (x) => Array.from(x || []); // normaliza arrays vindos do realm do vm

const SETE_MAQUINAS = ['IMP 01', 'IMP 02', 'IMP 03', 'IMP 04', 'IMP 05', 'Riscador', 'CORTE VINCO ROTATIVA'];

test('máquinas: canon é exatamente IMP 01..05 + Riscador + CORTE VINCO ROTATIVA', () => {
  assert.deepEqual(arr(api.canonMaquinas), SETE_MAQUINAS);
});

test('máquinas: opções têm só as 7 canônicas, sem Acabamento/Coladeira', () => {
  const r = api.buildMaquinasOptions('-- Selecionar --', '');
  SETE_MAQUINAS.forEach((m) => {
    assert.ok(r.html.indexOf('value="' + m + '"') !== -1, 'faltou ' + m);
  });
  assert.equal(r.html.indexOf('Acabamento'), -1);
  assert.equal(r.html.indexOf('Coladeira'), -1);
  // placeholder + 7 canônicas = 8 <option>
  assert.equal((r.html.match(/<option/g) || []).length, 8);
  assert.deepEqual(arr(r.extras), []);
});

test('máquinas: valor legado não canônico é preservado (não perde edição)', () => {
  const r = api.buildMaquinasOptions('-- Selecionar --', 'COLADEIRA ANTIGA');
  assert.deepEqual(arr(r.extras), ['COLADEIRA ANTIGA']);
  assert.ok(r.html.indexOf('value="COLADEIRA ANTIGA"') !== -1);
  assert.equal(r.selected, 'COLADEIRA ANTIGA');
  assert.equal((r.html.match(/<option/g) || []).length, 9);
});

test('máquinas: valor canônico (mesmo com espaços/acentos) não vira "extra"', () => {
  assert.deepEqual(arr(api.buildMaquinasOptions('p', 'imp  01').extras), []);
  assert.deepEqual(arr(api.buildMaquinasOptions('p', 'riscador').extras), []);
  assert.deepEqual(arr(api.buildMaquinasOptions('p', 'corte vinco rotativa').extras), []);
});

test('vendedores: só ativos entram na lista (inativo/status não)', () => {
  const lista = [
    { id: '1', nome: 'Ana', ativo: true },
    { id: '2', nome: 'Beto', ativo: false },
    { id: '3', nome: 'Carla', status: 'inativo' },
    { id: '4', nome: 'Dora' },
  ];
  const r = api.buildVendedoresOptions(lista, '');
  assert.ok(r.html.indexOf('value="1"') !== -1);
  assert.ok(r.html.indexOf('value="4"') !== -1);
  assert.equal(r.html.indexOf('value="2"'), -1);
  assert.equal(r.html.indexOf('value="3"'), -1);
  assert.equal(r.inativo, false);
});

test('vendedores: inativo selecionado é mantido marcado "(inativo)"', () => {
  const lista = [
    { id: '1', nome: 'Ana', ativo: true },
    { id: '2', nome: 'Beto', ativo: false },
  ];
  const r = api.buildVendedoresOptions(lista, '2');
  assert.equal(r.inativo, true);
  assert.equal(r.selected, '2');
  assert.ok(r.html.indexOf('value="2"') !== -1);
  assert.ok(/Beto\s*\(inativo\)/.test(r.html), 'nome deveria vir marcado (inativo)');
});

test('clientes: deduplica por nome normalizado (acento/caixa/espaço)', () => {
  const lista = [
    { id: 'a', nome: 'Ábaco Ltda' },
    { id: 'b', nome: 'abaco ltda ' },
    { id: 'c', nome: 'Beta' },
    { id: 'd', nome: '   ' },
    null,
  ];
  const r = api.buildClientesOptions(lista);
  assert.deepEqual(arr(r.nomes), ['Ábaco Ltda', 'Beta']);
});

test('clientes: mostra documento/cidade no label para diferenciar', () => {
  const lista = [
    { id: 'a', nome: 'ACME', cnpj: '11.111.111/0001-11', cidade: 'São Paulo', uf: 'SP' },
    { id: 'b', nome: 'Beta', cidade: 'Curitiba' },
  ];
  const r = api.buildClientesOptions(lista);
  const acme = r.items.find((o) => o.nome === 'ACME');
  const beta = r.items.find((o) => o.nome === 'Beta');
  assert.ok(acme.label.indexOf('11.111.111/0001-11') !== -1);
  assert.ok(acme.label.indexOf('São Paulo/SP') !== -1);
  assert.equal(beta.label, 'Curitiba');
  assert.ok(r.html.indexOf('label="11.111.111/0001-11 · São Paulo/SP"') !== -1);
});

test('clientes: ordena por nome (pt-BR) e não inventa opções vazias', () => {
  const lista = [{ nome: 'Zeta' }, { nome: 'alfa' }, { nome: '' }, {}];
  const r = api.buildClientesOptions(lista);
  assert.deepEqual(arr(r.nomes), ['alfa', 'Zeta']);
  assert.equal((r.html.match(/<option/g) || []).length, 2);
});
