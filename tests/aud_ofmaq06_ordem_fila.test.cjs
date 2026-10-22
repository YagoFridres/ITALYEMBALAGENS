'use strict';
// OFMAQ-06 · Subir/descer na fila só aparecia depois de recarregar (F5).
//
// Defeito (prompt OFMAQ-06, alto):
//   reorderWithinDay / moveToPositionWithinDay gravavam a nova ordem (PATCH de
//   ordem_maquina) e chamavam renderRows, mas com a MESMA chave estável
//   (_stableKeyOfState). renderRows então reaplicava state._rowOrderMap (ordem
//   antiga) por cima, e a tela só mudava depois do reload.
//
// Correção: antes de renderRows, `state._stableOrderLastKey = null;` e
// `state._rowOrderMap = null;` (nos dois handlers).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const PATCH = fs.readFileSync(path.join(ROOT, 'patch.js'), 'utf8');

function extrairFuncao(src, marcador) {
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

const F_REORDER = extrairFuncao(PATCH, 'async function reorderWithinDay(id, direction)');
const F_MOVE = extrairFuncao(PATCH, 'async function moveToPositionWithinDay(id, targetPosition)');

function montarVm(rows) {
  const byId = {};
  rows.forEach((r) => { byId[r.id] = r; });
  const chamadas = [];
  const ctx = vm.createContext({
    console,
    state: {
      _stableOrderLastKey: 'CHAVE-ATUAL',
      _rowOrderMap: new Map(rows.map((r, i) => [r.id, i])),
      rowsData: rows,
    },
    window: {},
    // stubs
    rowById: (id) => byId[id],
    rowsForMachineDay: () => rows.slice(),
    _isGroupOrderInconsistent: () => false,
    persistGroupOrder: () => { chamadas.push('persistGroupOrder'); },
    updateSeq: () => { chamadas.push('updateSeq'); },
    applyDisplaySeqToState: () => {},
    updateToolbar: () => {},
    ensureShell: () => ({}),
    renderRows: () => { chamadas.push('renderRows'); },
    showOfmaqCenterConfirm: () => {},
  });
  vm.runInContext(F_REORDER + '\n' + F_MOVE, ctx);
  vm.runInContext('globalThis.__api = { reorderWithinDay, moveToPositionWithinDay };', ctx);
  return { api: ctx.__api, ctx, chamadas };
}

const ROWS = [
  { id: 'a', maquina: 'IMP 01', prazoIso: '2026-10-22', order: 1 },
  { id: 'b', maquina: 'IMP 01', prazoIso: '2026-10-22', order: 2 },
  { id: 'c', maquina: 'IMP 01', prazoIso: '2026-10-22', order: 3 },
];

// ── 1. Fonte: reset antes de renderRows nos dois handlers ───────────────────
test('OFMAQ-06: reseta o cache de ordem antes de renderRows (fonte)', () => {
  for (const bloco of [F_REORDER, F_MOVE]) {
    const iReset = bloco.indexOf('state._stableOrderLastKey = null;');
    const iMap = bloco.indexOf('state._rowOrderMap = null;');
    assert.ok(iReset >= 0 && iMap >= 0, 'faltou o reset do cache de ordem');
    const iRender = bloco.indexOf('renderRows(ensureShell());');
    assert.ok(iReset < iRender && iMap < iRender, 'o reset precisa vir ANTES de renderRows');
  }
});

// ── 2. Comportamento: subir/descer invalida a ordem antiga ──────────────────
test('OFMAQ-06: reorderWithinDay invalida _rowOrderMap (tela muda sem reload)', async () => {
  const { api, ctx, chamadas } = montarVm(ROWS.map((r) => Object.assign({}, r)));
  await api.reorderWithinDay('a', 1);
  assert.ok(chamadas.includes('renderRows'), 'renderRows não foi chamado');
  assert.equal(ctx.state._stableOrderLastKey, null, 'a chave estável devia ficar nula');
  assert.equal(ctx.state._rowOrderMap, null, 'o mapa de ordem antigo devia ser descartado');
});

test('OFMAQ-06: moveToPositionWithinDay invalida _rowOrderMap', async () => {
  const { api, ctx } = montarVm(ROWS.map((r) => Object.assign({}, r)));
  await api.moveToPositionWithinDay('a', 3);
  assert.equal(ctx.state._stableOrderLastKey, null);
  assert.equal(ctx.state._rowOrderMap, null);
});

test('OFMAQ-06: mover para a MESMA posição também invalida o cache', async () => {
  const { api, ctx } = montarVm(ROWS.map((r) => Object.assign({}, r)));
  await api.moveToPositionWithinDay('b', 2); // b já é a posição 2
  assert.equal(ctx.state._stableOrderLastKey, null);
  assert.equal(ctx.state._rowOrderMap, null);
});

// ── 3. Controle: sem o reset, renderRows reaplicaria a ordem antiga ─────────
test('OFMAQ-06: renderRows reaplica a ordem antiga quando o cache existe', () => {
  // Reproduz o ramo estável de renderRows para provar a causa do defeito.
  const state = { _stableOrderLastKey: 'K', _rowOrderMap: new Map([['c', 0], ['b', 1], ['a', 2]]) };
  const rowsArr = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const curStableKey = 'K';
  if (state._stableOrderLastKey !== curStableKey) {
    state._rowOrderMap = new Map(rowsArr.map((r, i) => [r.id, i]));
  } else if (state._rowOrderMap instanceof Map) {
    rowsArr.sort((a, b) => state._rowOrderMap.get(a.id) - state._rowOrderMap.get(b.id));
  }
  assert.deepEqual(rowsArr.map((r) => r.id), ['c', 'b', 'a'], 'sem reset, a ordem antiga volta');
});
