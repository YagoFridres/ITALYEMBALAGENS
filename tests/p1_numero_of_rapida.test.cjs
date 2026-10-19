'use strict';

/**
 * Testes unitários · Nº da OF indisponível NÃO bloqueia o salvar (correção da revisão).
 * Carrega a IIFE `patchNumeroOfRapidaNaoBloquearP1` do patch.js em um sandbox com
 * DOM mínimo e valida:
 *   - 503 (proximoNumeroOf devolve ''): o botão #btn-salvar-of-rapida fica HABILITADO,
 *     o número vira "Nº definido ao salvar" e o aviso com "Tentar de novo" aparece;
 *   - 200: o número calculado aparece normalmente e o aviso some;
 *   - "Tentar de novo" reaplica o estado;
 *   - a sobrescrita é reaplicada após abrirNovaOfRapida;
 *   - nenhum outro ponto de patch.js bloqueia por falta de número e o `numero`
 *     inválido/ausente é removido do payload (o servidor define o número real).
 * Sem banco. Rodar: node --test tests/p1_numero_of_rapida.test.cjs
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'patch.js'), 'utf8');
const MARCADOR = '(function patchNumeroOfRapidaNaoBloquearP1() {';
const MARCADOR_FIM = '(function patchListasLimpasP1() {';

function blocoFuncao() {
  const ini = SRC.indexOf(MARCADOR);
  const fim = SRC.indexOf(MARCADOR_FIM, ini);
  assert.ok(ini > 0, 'IIFE patchNumeroOfRapidaNaoBloquearP1 não encontrada em patch.js');
  assert.ok(fim > ini, 'marcador de fim (patchListasLimpasP1) não encontrado');
  return SRC.slice(ini, fim);
}

function fakeEl(tag) {
  return {
    tagName: String(tag || 'div').toUpperCase(),
    id: '',
    textContent: '',
    innerHTML: '',
    value: '',
    disabled: false,
    style: {},
    dataset: {},
    children: [],
    firstChild: null,
    nextSibling: null,
    firstElementChild: null,
    parentElement: null,
    _removed: false,
    _listeners: {},
    remove() { this._removed = true; },
    appendChild(c) { this.children.push(c); c.parentElement = this; return c; },
    insertBefore(c) { this.children.unshift(c); c.parentElement = this; return c; },
    closest() { return null; },
    querySelector(sel) {
      if (String(sel || '').indexOf('of-r-btn-tentar-numero') !== -1) return this.__btnTentar || null;
      return null;
    },
    addEventListener(ev, fn) { this._listeners[ev] = fn; },
    setAttribute() {},
    removeAttribute() {},
  };
}

function criarAmbiente() {
  const criados = [];
  const spanNum = fakeEl('span'); spanNum.id = 'of-r-numero';
  const btn = fakeEl('button'); btn.id = 'btn-salvar-of-rapida';
  const mapa = { 'of-r-numero': spanNum, 'btn-salvar-of-rapida': btn };

  const document = {
    getElementById(id) {
      if (id === 'of-r-aviso-numero') {
        const b = criados.filter((c) => c.id === 'of-r-aviso-numero' && !c._removed).pop();
        return b || null;
      }
      return mapa[id] || null;
    },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    createElement(tag) {
      const el = fakeEl(tag);
      if (el.tagName === 'DIV') {
        const btnTentar = fakeEl('button');
        btnTentar.id = 'of-r-btn-tentar-numero';
        el.__btnTentar = btnTentar;
      }
      criados.push(el);
      return el;
    },
    documentElement: {},
    addEventListener() {},
    readyState: 'complete',
  };

  const sandbox = {
    document,
    console,
    setTimeout() {},
    clearTimeout() {},
    Promise,
    // stubs das funções globais do index.html
    _atualizarEstadoNumeroOfRapida: function () { return 'ORIG'; },
    abrirNovaOfRapida: function () { return 'ABRIU'; },
    proximoNumeroOf: function () { return Promise.resolve(''); },
  };
  sandbox.window = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(blocoFuncao(), sandbox);
  return { sandbox, spanNum, btn };
}

test('503: botão Salvar fica habilitado e o número vira "Nº definido ao salvar"', () => {
  const { sandbox, spanNum, btn } = criarAmbiente();
  const api = sandbox.__p1NumeroRapida;
  assert.ok(api && typeof api.aplicarEstado === 'function', 'API interna não exposta');

  const r = api.aplicarEstado(''); // 503 → o index.html resolve a falha como ''
  assert.equal(r, false);
  assert.equal(btn.disabled, false, 'o botão Salvar NÃO pode ser desabilitado');
  assert.equal(btn.textContent, '⚡ Salvar OF');
  assert.equal(spanNum.textContent, 'Nº definido ao salvar');
  assert.equal(sandbox._ofRapidaNumeroValido, false);
  const aviso = sandbox.document.getElementById('of-r-aviso-numero');
  assert.ok(aviso, 'o aviso discreto deve existir');
  assert.ok(aviso.innerHTML.indexOf('Tentar de novo') !== -1, 'o aviso deve ter "Tentar de novo"');
});

test('200: número válido aparece normalmente e o aviso some', () => {
  const { sandbox, spanNum, btn } = criarAmbiente();
  const api = sandbox.__p1NumeroRapida;
  api.aplicarEstado(''); // cria o aviso
  assert.ok(sandbox.document.getElementById('of-r-aviso-numero'), 'aviso deveria existir');

  const r = api.aplicarEstado('1234');
  assert.equal(r, true);
  assert.equal(spanNum.textContent, '1234');
  assert.equal(btn.textContent, '⚡ Salvar OF');
  assert.equal(btn.disabled, false);
  assert.equal(sandbox._ofRapidaNumeroValido, true);
  assert.equal(sandbox.document.getElementById('of-r-aviso-numero'), null, 'o aviso deve ser removido');
});

test('"Tentar de novo" reaplica o estado do número', async () => {
  const { sandbox, spanNum } = criarAmbiente();
  const api = sandbox.__p1NumeroRapida;
  api.aplicarEstado('');
  const aviso = sandbox.document.getElementById('of-r-aviso-numero');
  const btnTentar = aviso.__btnTentar;
  assert.ok(btnTentar && btnTentar._listeners.click, 'handler de "Tentar de novo" não registrado');

  sandbox.proximoNumeroOf = function () { return Promise.resolve('4321'); };
  btnTentar._listeners.click();
  await new Promise((res) => setImmediate(res));
  await new Promise((res) => setImmediate(res));
  assert.equal(spanNum.textContent, '4321');
});

test('sobrescrita é reaplicada após abrirNovaOfRapida', () => {
  const { sandbox } = criarAmbiente();
  const api = sandbox.__p1NumeroRapida;
  assert.equal(sandbox._atualizarEstadoNumeroOfRapida, api.aplicarEstado, 'não instalou a sobrescrita');

  // simula outro ponto redefinindo a função global...
  sandbox._atualizarEstadoNumeroOfRapida = function () { return 'HACK'; };
  const out = sandbox.abrirNovaOfRapida();
  assert.equal(out, 'ABRIU');
  assert.equal(sandbox._atualizarEstadoNumeroOfRapida, api.aplicarEstado, 'deveria reaplicar após abrir');
});

test('patch.js: nenhum bloqueio por falta de número e "numero" inválido sai do payload', () => {
  // O bloqueio original (index.html ~4059) desabilita o botão com o rótulo
  // "Nº da OF indisponível". A sobrescrita do patch.js troca isso por um aviso
  // discreto, SEM desabilitar. Aqui garantimos que o código de bloqueio não
  // reaparece no patch.js (o texto pode existir apenas em comentário explicativo).
  assert.equal(
    SRC.indexOf("textContent = 'Nº da OF indisponível'"),
    -1,
    'patch.js não pode reimplementar o bloqueio do botão por falta de número',
  );
  assert.ok(SRC.indexOf('__p1NumeroOFNaoBloquear') !== -1, 'faltou a IIFE de override do número');
  assert.ok(SRC.indexOf('delete body[_numCampos[_nj]]') !== -1, 'faltou remover os campos de numero do payload');
  assert.ok(SRC.indexOf('_numInt >= 1000') !== -1, 'a regra de número válido (>= 1000) deve existir');
});
