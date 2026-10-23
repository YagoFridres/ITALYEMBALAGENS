'use strict';
// REL-17 · Datas um dia antes nas impressões da Central de Relatórios.
// `rrFmtDate` (patch.js) fazia `new Date('2026-10-09').toLocaleDateString('pt-BR')`.
// Como '2026-10-09' é meia-noite UTC, em São Paulo (UTC-3) virava 08/10 — a
// impressão mostrava um dia antes. Agora delega à F-1 (`window._fmtDataBR`),
// que monta a data sem hora por split('-'), sem passar pelo `new Date`.
//
// Roda a função REAL extraída de patch.js por casamento de chaves.
// Rodar: node --test tests/aud_rel17_datas_impressao.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const PATCH = fs.readFileSync(path.join(ROOT, 'patch.js'), 'utf8');

function extrairFunc(src, nome) {
  const i = src.indexOf('function ' + nome + '(');
  assert.ok(i >= 0, 'função não encontrada: ' + nome);
  let j = src.indexOf('{', src.indexOf(')', i));
  let d = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (d === 0) return src.slice(i, k + 1); }
  }
  throw new Error('fim não achado: ' + nome);
}

// Mesma extração usada em aud_f1_fmt_data_br.test.cjs (F-1 real de patch.js).
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

const FUNC = extrairFunc(PATCH, 'rrFmtDate');

// ── Cenário real: window._fmtDataBR (F-1) presente ────────────────────────
function montar(withF1) {
  const win = {};
  const ctx = { window: win, console };
  vm.createContext(ctx);
  if (withF1) vm.runInContext(extrairAtribuicao(PATCH, 'window._fmtDataBR = function'), ctx);
  vm.runInContext('var rrFmtDate = ' + FUNC + ';', ctx);
  return vm.runInContext('rrFmtDate', ctx);
}

test('REL-17: data pura NÃO recua um dia (usa F-1)', () => {
  const rrFmtDate = montar(true);
  assert.strictEqual(rrFmtDate('2026-10-09'), '09/10/2026');
  assert.strictEqual(rrFmtDate('2026-01-01'), '01/01/2026');
  assert.strictEqual(rrFmtDate('2026-12-31'), '31/12/2026');
});

test('REL-17: ISO com hora converte para America/Sao_Paulo (F-1)', () => {
  const rrFmtDate = montar(true);
  assert.strictEqual(rrFmtDate('2026-10-09T23:30:00-03:00'), '09/10/2026');
  assert.strictEqual(rrFmtDate('2026-10-10T01:30:00Z'), '09/10/2026');
});

test('REL-17: vazio/inválido -> — (F-1)', () => {
  const rrFmtDate = montar(true);
  assert.strictEqual(rrFmtDate(''), '—');
  assert.strictEqual(rrFmtDate(null), '—');
  assert.strictEqual(rrFmtDate(undefined), '—');
  assert.strictEqual(rrFmtDate('nao-e-data'), '—');
});

test('REL-17: fallback sem F-1 ainda fixa timeZone America/Sao_Paulo', () => {
  const rrFmtDate = montar(false);
  // 2026-10-10T01:30Z = 2026-10-09 22:30 em SP (independente do TZ do processo).
  assert.strictEqual(rrFmtDate('2026-10-10T01:30:00Z'), '09/10/2026');
  assert.strictEqual(rrFmtDate(''), '—');
  assert.strictEqual(rrFmtDate(null), '—');
  assert.strictEqual(rrFmtDate('lixo'), '—');
});

test('REL-17: guardas estáticas no fonte', () => {
  const bloco = FUNC;
  assert.ok(/window\._fmtDataBR/.test(bloco), 'deve delegar à F-1 (window._fmtDataBR)');
  assert.ok(/timeZone:\s*'America\/Sao_Paulo'/.test(bloco), 'fallback deve fixar timeZone');
  // O ramo antigo sem timeZone não pode reaparecer.
  assert.ok(!/toLocaleDateString\('pt-BR'\)\s*;/.test(bloco), "não pode usar toLocaleDateString('pt-BR') sem opções");
});
