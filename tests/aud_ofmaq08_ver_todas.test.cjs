'use strict';
// OFMAQ-08 · "Ver Todas as Máquinas" deixava blocos vazios.
//
// Causa: no modo showAllMachines cada bloco de máquina tem o PRÓPRIO
// .ofmaq-final-table-wrap. renderRows procurava a "tabela única" com
// `rootEl.querySelector('.ofmaq-final-table-wrap')`, que devolvia o wrap de um
// BLOCO. A checagem de colunas (`curThs.length !== 15`, hoje o thead tem 16)
// reprovava esse wrap e o removia -> o bloco ficava sem <table>, um por render.
//
// Correção: a "tabela única" só é considerada fora dos blocos
// (.ofmaq-final-machine-blocks); no ramo showAll o oldWrap é descartado e cada
// bloco mantém a própria <table>; a checagem de colunas passa a esperar 16.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const PATCH = fs.readFileSync(path.join(ROOT, 'patch.js'), 'utf8');

// Fatia o IIFE canônico do OFMAQ (há renderRows homônimo legado antes dele).
const CANON_START = PATCH.indexOf('function patchOfmaqFinalCanonical');
assert.ok(CANON_START >= 0, 'não achei patchOfmaqFinalCanonical');
const CANON = PATCH.slice(CANON_START);

const I_ROWS = CANON.indexOf('function renderRows(shell)');
assert.ok(I_ROWS >= 0, 'não achei renderRows no canônico');
const BLOCO = CANON.slice(I_ROWS, I_ROWS + 12000);
const I_DROP = BLOCO.indexOf('if (oldWrap) { try { oldWrap.remove(); }');
const I_BLOCKS_CRIADOS = BLOCO.indexOf("blocks.className = 'ofmaq-final-machine-blocks'");
assert.ok(I_DROP >= 0 && I_BLOCKS_CRIADOS >= 0, 'não localizei o descarte do oldWrap / criação dos blocos');
const RAMO = BLOCO.slice(Math.max(0, I_DROP - 400), I_BLOCKS_CRIADOS + 3000);

// ── 1. Fonte: o wrap único não pode ser confundido com o wrap de um bloco ───
test('OFMAQ-08: seletor da tabela única ignora wraps dentro dos blocos', () => {
  const iRows = BLOCO.indexOf('var rows = sortedVisibleRows');
  const cabeca = BLOCO.slice(0, iRows);
  assert.ok(/rootEl\.querySelectorAll\('\.ofmaq-final-table-wrap'\)/.test(cabeca), 'deve varrer todos os wraps');
  assert.ok(/ofmaq-final-machine-blocks/.test(cabeca), 'deve excluir os wraps que estão dentro de um bloco');
  assert.ok(!/var oldWrap = rootEl\.querySelector\('\.ofmaq-final-table-wrap'\)/.test(BLOCO), 'o seletor antigo (que pegava um bloco) sobrou');
});

test('OFMAQ-08: checagem de colunas espera 16 (o thead tem 16 <th>)', () => {
  assert.ok(/curThs\.length !== 16/.test(BLOCO), 'a checagem de colunas ainda espera 15');
  assert.ok(!/curThs\.length !== 15/.test(BLOCO), 'a checagem antiga de 15 sobrou');
  const iThead = BLOCO.indexOf("var theadFixed = '<thead>");
  const thead = BLOCO.slice(iThead, BLOCO.indexOf('if (!state.showAllMachines)', iThead));
  assert.equal((thead.match(/<th>/g) || []).length, 16, 'o thead canônico deveria ter 16 colunas');
});

// ── 2. Fonte: ramo showAll descarta o oldWrap e cria tabela por bloco ──────
test('OFMAQ-08: ramo "Ver Todas" descarta a tabela única antes de montar os blocos', () => {
  assert.ok(I_DROP < I_BLOCKS_CRIADOS, 'o descarte do oldWrap deve vir antes de criar os blocos');
  assert.ok(/if \(oldWrap\) \{ try \{ oldWrap\.remove\(\); \}/.test(RAMO), 'o ramo showAll não descarta o oldWrap');
});

test('OFMAQ-08: cada bloco de máquina monta a própria <table>', () => {
  const iSec = RAMO.indexOf('ofmaq-final-machine-block');
  const iTable = RAMO.indexOf('<table class="ofmaq-final-table">', iSec);
  assert.ok(iTable > iSec, 'o bloco de máquina não cria a própria <table>');
  assert.ok(RAMO.indexOf('theadFixed', iSec) > iSec, 'o bloco de máquina não reutiliza o thead canônico');
});

// ── 3. Simulação do seletor (mini-DOM) ─────────────────────────────────────
function el(cls) {
  const e = {
    _cls: String(cls || ''),
    _children: [],
    parentNode: null,
    classList: { contains: (c) => e._cls.split(' ').indexOf(c) >= 0 },
  };
  return e;
}
function add(parent, child) { child.parentNode = parent; parent._children.push(child); return child; }
function walk(root, fn) { for (const c of root._children) { fn(c); walk(c, fn); } }
function qsa(root, cls) { const out = []; walk(root, (e) => { if (e.classList.contains(cls)) out.push(e); }); return out; }

// Seletor NOVO: primeiro wrap fora de .ofmaq-final-machine-blocks.
function wrapUnico(rootEl) {
  const all = qsa(rootEl, 'ofmaq-final-table-wrap');
  for (const w of all) {
    let inside = false;
    for (let p = w.parentNode; p && p !== rootEl; p = p.parentNode) {
      if (p.classList.contains('ofmaq-final-machine-blocks')) { inside = true; break; }
    }
    if (!inside) return w;
  }
  return null;
}

function arvoreShowAll() {
  const root = el('ofmaq-final-container');
  const blocks = add(root, el('ofmaq-final-machine-blocks'));
  const s1 = add(blocks, el('ofmaq-final-machine-block'));
  add(s1, el('ofmaq-final-table-wrap'));
  const s2 = add(blocks, el('ofmaq-final-machine-block'));
  add(s2, el('ofmaq-final-table-wrap'));
  return root;
}

test('OFMAQ-08: em "Ver Todas" o seletor novo NÃO devolve wrap de bloco (o antigo devolvia)', () => {
  const root = arvoreShowAll();
  // seletor ANTIGO (querySelector pega o 1º match, mesmo dentro de um bloco)
  const antigo = qsa(root, 'ofmaq-final-table-wrap')[0];
  assert.ok(antigo, 'o seletor antigo encontrava um wrap de bloco');
  assert.ok(antigo.parentNode.classList.contains('ofmaq-final-machine-block'), 'era o wrap de um bloco (seria removido)');
  // seletor NOVO
  assert.equal(wrapUnico(root), null, 'o seletor novo não pode pegar wrap de bloco');
});

test('OFMAQ-08: fora dos blocos, o seletor novo encontra a tabela única', () => {
  const root = el('ofmaq-final-container');
  const unico = add(root, el('ofmaq-final-table-wrap'));
  const blocks = add(root, el('ofmaq-final-machine-blocks'));
  const s1 = add(blocks, el('ofmaq-final-machine-block'));
  add(s1, el('ofmaq-final-table-wrap'));
  assert.equal(wrapUnico(root), unico, 'deveria achar a tabela única (fora dos blocos)');
});
