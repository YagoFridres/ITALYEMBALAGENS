'use strict';
/**
 * Regressão do hotfix P1 (19/10/2026): o bloco patchNumeroOfRapidaNaoBloquearP1
 * NÃO pode envolver window.abrirNovaOfRapida. Um envelope extra fazia o guarda
 * patchFinalReentryGuards se aplicar duas vezes com o mesmo estado e bloquear a
 * abertura da OF Rápida ("[PATCH][REENTRY-BLOCKED] abrirNovaOfRapida").
 * O teste de interface real está em tests/ui/of_rapida_ui.cjs (Playwright).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const src = fs.readFileSync(path.join(__dirname, '..', 'patch.js'), 'utf8');
const ini = src.indexOf('(function patchNumeroOfRapidaNaoBloquearP1() {');
const bloco = ini >= 0 ? src.slice(ini, src.indexOf('\n})();', ini)) : '';

test('bloco P1 do número existe', () => {
  assert.ok(bloco.length > 0);
});

test('bloco P1 do número não reatribui window.abrirNovaOfRapida', () => {
  assert.equal(/window\.abrirNovaOfRapida\s*=/.test(bloco), false);
  assert.equal(/decorarAbrir/.test(bloco), false);
});

test('bloco P1 do número continua sobrescrevendo _atualizarEstadoNumeroOfRapida', () => {
  assert.ok(/window\._atualizarEstadoNumeroOfRapida\s*=\s*aplicarEstado/.test(bloco));
});
