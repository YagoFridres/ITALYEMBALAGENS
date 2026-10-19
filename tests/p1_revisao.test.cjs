'use strict';
// P1 · correções da revisão (itens 1 e 2) — verificação ESTÁTICA em patch.js.
//
// O teste interativo (Playwright 1366/390 px contra o mock) fica marcado como
// "NÃO VALIDADO: precisa de homologação" no PR. Aqui garantimos, por leitura do
// arquivo, que o código restaurado/ajustado está presente e na ordem correta.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'patch.js'), 'utf8');

function blocoDe(marcador, tamanho) {
  const i = SRC.indexOf(marcador);
  assert.ok(i >= 0, 'não achei ' + marcador + ' em patch.js');
  return SRC.slice(i, i + tamanho);
}

// ── Item 1 · edição de OF existente restaurada ──────────────────────────────
test('abrirModalOF: sem id abre a OF Rápida; com id restaura a EDIÇÃO completa', () => {
  const bloco = blocoDe('function patchAbrirModalOF()', 6000);

  // ramo SEM id → nova OF pela OF Rápida
  const iSemId = bloco.indexOf('if (!sid) {');
  assert.ok(iSemId >= 0, 'faltou o ramo "sem id"');
  const semId = bloco.slice(iSemId, iSemId + 160);
  assert.ok(semId.indexOf('window.abrirNovaOfRapida()') >= 0, 'ramo sem id deve abrir a OF Rápida');

  // ramo COM id → edição (bloco restaurado do e2c8930)
  const marcadores = [
    'window.__ofRapidaPendingEditId = sid;',
    "window.__setOfRapidaEditContext(sid, '')",
    'var of = await fetchOf(sid);',
    "setVal('of-r-empresa', empId)",
    "setVal('of-r-maquina', maquina)",
    "setVal('of-r-empresa'", // empresa preenchida
    "header.textContent = '✏️ Editar OF Rápida'",
    "btn.textContent = '💾 Salvar Alterações'",
    'patchSalvarOfRapida();',
  ];
  marcadores.forEach(function(m) {
    assert.ok(bloco.indexOf(m) >= 0, 'faltou no bloco de edição: ' + m);
  });

  // a edição vem DEPOIS do ramo sem id (com id → fluxo de edição)
  assert.ok(bloco.indexOf('var of = await fetchOf(sid);') > iSemId, 'edição deve vir após o ramo sem id');
});

test('salvar na edição usa salvarEdicaoOf (PATCH/PUT), nunca POST no hook de edição', () => {
  const bloco = blocoDe('function patchSalvarOfRapida()', 900);
  assert.ok(bloco.indexOf("'__patch_edicao_of_rapida__'") >= 0, 'faltou o hook de override da edição');
  assert.ok(bloco.indexOf('salvarEdicaoOf') >= 0, 'edição deve salvar via salvarEdicaoOf');
  assert.ok(bloco.indexOf('POST') === -1, 'o hook de edição não deve usar POST');
});

// ── Item 2 · MutationObserver com debounce ──────────────────────────────────
test('patchOfRapidaUnicaEntradaP1.observar tem debounce (150 ms) e filtra addedNodes', () => {
  const bloco = blocoDe('function patchOfRapidaUnicaEntradaP1()', 8000);
  assert.ok(bloco.indexOf('new MutationObserver') >= 0, 'faltou o MutationObserver');
  assert.ok(bloco.indexOf('addedNodes') >= 0, 'observar deve reagir só a nós ADICIONADOS');
  assert.ok(bloco.indexOf('}, 150);') >= 0, 'faltou o debounce de 150 ms');
  assert.ok(bloco.indexOf('requestAnimationFrame') >= 0, 'deve agrupar com requestAnimationFrame');
  // mantém os disparos iniciais
  assert.ok(bloco.indexOf('[0, 200, 600, 1500, 3000, 6000]') >= 0, 'faltou manter os setTimeout iniciais');
});
