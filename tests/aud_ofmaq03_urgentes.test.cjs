'use strict';
// OFMAQ-03 · Modal "OFs Urgentes em Aberto" sempre vazio.
//
// Defeito (prompt OFMAQ-03, alto):
//   buildUrgentOfsData lia `o.urg`/`o.urgente`/`o.status`/`o.papel_comprado` nos
//   itens de state.rowsData — que só têm `urgencia` e `ofRaw`. Resultado: o modal
//   abria vazio e marcava TODA OF como "sem papelão".
//
// Correção:
//   - urgência lida de `urgencia` (F-5) / `ofRaw.urg|urgente`;
//   - status lido de `ofRaw.status`;
//   - semPapelao = !!ofRaw.sem_papel.
//
// Extrai a função real do patch.js e roda num contexto `vm` (sem navegador).
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

const FN = extrairFuncao(PATCH, 'function buildUrgentOfsData()');

function montar(rowsData) {
  const ctx = vm.createContext({
    console,
    state: { rowsData: rowsData },
    ensureDefaults() {},
    normalizeMachine: (v) => String(v == null ? '' : v).trim(),
    fmtDateBR: (v) => String(v || ''),
    todayBrtIso: () => '2026-10-22',
  });
  vm.runInContext(FN, ctx);
  vm.runInContext('globalThis.__api = { buildUrgentOfsData };', ctx);
  return ctx.__api;
}

const OF = (over) => Object.assign({
  id: 'x', numero: '5000', cliente: 'Cliente', produto: 'Caixa',
  quantidade: 100, maquina: 'IMP 01', prazoIso: '2026-10-22',
  urgencia: 'normal', ofRaw: { status: 'Em aberto' },
}, over);

// ── 1. Fonte: campos corretos ───────────────────────────────────────────────
test('OFMAQ-03: fonte lê urgencia/ofRaw (não urg/papel_comprado/status fantasmas)', () => {
  assert.ok(/o\.urgencia === 'urgente'/.test(FN), 'não usa urgencia (F-5)');
  assert.ok(!/o\.urg === true/.test(FN), 'ainda usa o.urg fantasma');
  assert.ok(!/o\.papel_comprado/.test(FN), 'ainda usa o.papel_comprado fantasma');
  assert.ok(/!!raw\.sem_papel/.test(FN), 'semPapelao deve vir de ofRaw.sem_papel');
  assert.ok(/String\(raw\.status \|\| '—'\)/.test(FN), 'status deve vir de ofRaw.status');
});

// ── 2. Comportamento ────────────────────────────────────────────────────────
test('OFMAQ-03: OF urgente aberta aparece (1 OF)', () => {
  const api = montar([OF({ id: '1', urgencia: 'urgente', ofRaw: { status: 'Em aberto' } })]);
  const r = api.buildUrgentOfsData();
  assert.equal(r.totals.totalUrgOfs, 1);
  assert.equal(r.grupos.length, 1);
  assert.equal(r.grupos[0].maquina, 'IMP 01');
  assert.equal(r.grupos[0].items[0].ofId, '1');
});

test('OFMAQ-03: OF não urgente NÃO entra', () => {
  const api = montar([OF({ id: '2', urgencia: 'normal' })]);
  assert.equal(api.buildUrgentOfsData().totals.totalUrgOfs, 0);
});

test('OFMAQ-03: urgente mas concluída (ofRaw.status) fica de fora', () => {
  const api = montar([
    OF({ id: '3', urgencia: 'urgente', ofRaw: { status: 'Concluída' } }),
    OF({ id: '4', urgencia: 'urgente', ofRaw: { status: 'Cancelada' } }),
  ]);
  assert.equal(api.buildUrgentOfsData().totals.totalUrgOfs, 0);
});

test('OFMAQ-03: semPapelao = !!ofRaw.sem_papel (não marca todas)', () => {
  const api = montar([
    OF({ id: '5', urgencia: 'urgente', ofRaw: { status: 'Em aberto', sem_papel: false } }),
    OF({ id: '6', urgencia: 'urgente', ofRaw: { status: 'Em aberto', sem_papel: true } }),
  ]);
  const r = api.buildUrgentOfsData();
  assert.equal(r.totals.totalUrgOfs, 2);
  assert.equal(r.totals.totalSemPapelao, 1);
  const itens = r.grupos[0].items;
  assert.equal(itens.find((i) => i.ofId === '5').semPapelao, false);
  assert.equal(itens.find((i) => i.ofId === '6').semPapelao, true);
});

test('OFMAQ-03: status do item vem de ofRaw.status', () => {
  const api = montar([OF({ id: '7', urgencia: 'urgente', ofRaw: { status: 'Em aberto' } })]);
  assert.equal(api.buildUrgentOfsData().grupos[0].items[0].status, 'Em aberto');
});

test('OFMAQ-03: urg marcado no ofRaw também é reconhecido', () => {
  const api = montar([OF({ id: '8', urgencia: 'normal', ofRaw: { status: 'Em aberto', urg: true } })]);
  assert.equal(api.buildUrgentOfsData().totals.totalUrgOfs, 1);
});
