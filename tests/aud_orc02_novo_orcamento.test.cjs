'use strict';
// ORC-02 · "Novo Orçamento" não pode sobrescrever o orçamento anterior.
//
// Defeito (prompt ORC-02, crítico):
//   - o botão "＋ Novo Orçamento" (patch.js) chamava `window.abrirCalculadora()`
//     sem limpar o id do último orçamento editado → o Salvar fazia PUT nele.
//   - `closeCalcModalAfterSave` fechava o modal sem zerar `_orcIdAtual`/
//     `_orcNumeroAtual` (escopo index.html e window).
//
// Correção: o botão chama `window.novoOrcamentoCalc()`; o fechamento zera
// `_orcIdAtual`, `_orcNumeroAtual` e `window._orcIdAtual`/`window._orcNumeroAtual`.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const PATCH = fs.readFileSync(path.join(ROOT, 'patch.js'), 'utf8');

function extrairFunc(src, marcador) {
  const i = src.indexOf(marcador);
  assert.ok(i >= 0, 'não achei: ' + marcador);
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
  throw new Error('fim não achado: ' + marcador);
}

// ── 1. Fonte: botão "Novo Orçamento" chama novoOrcamentoCalc ───────────────
test('ORC-02 fonte: "＋ Novo Orçamento" chama window.novoOrcamentoCalc()', () => {
  const i = PATCH.indexOf("bind('orx-btn-novo'");
  assert.ok(i >= 0, 'não achei o bind do botão novo');
  const bloco = PATCH.slice(i, i + 400);
  const iNovo = bloco.indexOf('window.novoOrcamentoCalc(');
  const iAbrir = bloco.indexOf('window.abrirCalculadora(');
  assert.ok(iNovo >= 0, 'não chama novoOrcamentoCalc');
  // abrirCalculadora só pode aparecer como FALLBACK, depois do novoOrcamentoCalc
  assert.ok(iAbrir === -1 || iNovo < iAbrir, 'chama abrirCalculadora antes/junto de novoOrcamentoCalc');
});

// ── 2. Fonte: closeCalcModalAfterSave zera o orçamento atual ───────────────
test('ORC-02 fonte: closeCalcModalAfterSave zera _orcIdAtual (escopo + window)', () => {
  const corpo = extrairFunc(PATCH, 'function closeCalcModalAfterSave()');
  assert.ok(/_orcIdAtual\s*=\s*null/.test(corpo), 'não zera _orcIdAtual');
  assert.ok(/_orcNumeroAtual\s*=\s*null/.test(corpo), 'não zera _orcNumeroAtual');
  assert.ok(/window\._orcIdAtual\s*=\s*null/.test(corpo), 'não zera window._orcIdAtual');
});

// ── 3. Funcional: rodar closeCalcModalAfterSave com estado preenchido ─────
function criarEl() {
  return {
    value: '', textContent: '', dataset: {},
    style: { setProperty() {} },
    classList: { add() {}, remove() {}, contains() { return false; } },
    querySelector() { return null; }
  };
}

test('ORC-02 funcional: fechar após salvar zera o id/número atual', () => {
  const sandbox = {
    console,
    document: { getElementById() { return criarEl(); }, querySelector() { return null; } },
    window: { _orcIdAtual: 'id-antigo', _orcNumeroAtual: '123' },
    fecharCalculadora() {},
    _orcIdAtual: 'id-antigo',
    _orcNumeroAtual: '123'
  };
  const ctx = vm.createContext(sandbox);
  vm.runInContext(extrairFunc(PATCH, 'function closeCalcModalAfterSave()'), ctx);
  vm.runInContext('closeCalcModalAfterSave();', ctx);
  assert.equal(sandbox._orcIdAtual, null, '_orcIdAtual não zerado');
  assert.equal(sandbox._orcNumeroAtual, null, '_orcNumeroAtual não zerado');
  assert.equal(sandbox.window._orcIdAtual, null, 'window._orcIdAtual não zerado');
  assert.equal(sandbox.window._orcNumeroAtual, null, 'window._orcNumeroAtual não zerado');
});
