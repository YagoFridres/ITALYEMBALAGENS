'use strict';
// F-1 · _fmtDataBR — data sem hora montada por split (sem new Date).
// Não depende do TZ do processo: o ramo com hora fixa timeZone America/Sao_Paulo.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const patch = fs.readFileSync(path.join(ROOT, 'patch.js'), 'utf8');

// Extrai a atribuição por casamento de chaves (não depende de nenhum outro
// bloco do patch.js existir depois dela).
function extrairAtribuicao(src, marcador) {
  const i = src.indexOf(marcador);
  assert.ok(i >= 0, 'não achei: ' + marcador);
  const j = src.indexOf('{', i);
  let d = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (d === 0) return src.slice(i, k + 1) + ';'; }
  }
  throw new Error('fim não achado: ' + marcador);
}

const win = {};
const ctx = { window: win, console };
vm.createContext(ctx);
vm.runInContext(extrairAtribuicao(patch, 'window._fmtDataBR = function'), ctx);

test("F-1: '2026-10-09' -> '09/10/2026' (ramo split, sem new Date)", () => {
  assert.strictEqual(win._fmtDataBR('2026-10-09'), '09/10/2026');
  assert.strictEqual(win._fmtDataBR('2015-01-15'), '15/01/2015');
});

test('F-1: ISO com hora converte para America/Sao_Paulo', () => {
  assert.strictEqual(win._fmtDataBR('2026-10-09T23:30:00-03:00'), '09/10/2026');
  assert.strictEqual(win._fmtDataBR('2026-10-10T01:30:00Z'), '09/10/2026');
});

test("F-1: vazio/inválido -> '—'", () => {
  assert.strictEqual(win._fmtDataBR(''), '—');
  assert.strictEqual(win._fmtDataBR(null), '—');
  assert.strictEqual(win._fmtDataBR(undefined), '—');
  assert.strictEqual(win._fmtDataBR('nao-e-data'), '—');
});
