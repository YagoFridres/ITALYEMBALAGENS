'use strict';
// REL-10 · Filtro Dia/Semana de Caixas Perdidas devolvia o mês inteiro.
//
// Causa: `filtrarPeriodo` usava `byMesRef || byData` e `rangeFimExclusivo = customFim`
// (com `d < customFimDate`), isto é, a data final era tratada como EXCLUSIVA. Um
// filtro de 1 dia (08/10 → 08/10) devolvia o mês inteiro.
// Correção: com período, filtra `data` entre início e fim INCLUSIVOS
// (`rowDateIso` + `rangeFimInclusivo`); `mes_referencia` só vale para linhas SEM `data`.
//
// Roda o código REAL de server.js (helpers + bloco do `filtrarPeriodo` da rota
// `/api/caixas-perdidas/dashboard`) num sandbox vm, sem banco.
//
// Rodar: node --test tests/aud_rel10_caixas_perdidas_periodo.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8').replace(/\r\n/g, '\n');

function extrairFunc(src, nome) {
  const i = src.indexOf('function ' + nome + '(');
  assert.ok(i >= 0, 'função não encontrada: ' + nome);
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
  throw new Error('fim não achado: ' + nome);
}

// Bloco real do `filtrarPeriodo` (rota /api/caixas-perdidas/dashboard): começa em
// `const parseRowDate` e termina no `});` que fecha o `filtrarPeriodo`.
const BLOCO_INI = SRC.indexOf('const parseRowDate = (row) => {');
assert.ok(BLOCO_INI >= 0, 'início do bloco filtrarPeriodo não encontrado');
const BLOCO_FIM_MARK = "      return mesRef === (String(year) + '-' + String(month).padStart(2, '0')) || matchMonthYear(d, month, year);\n    });";
const _bfi = SRC.indexOf(BLOCO_FIM_MARK, BLOCO_INI);
assert.ok(_bfi >= 0, 'fim do bloco filtrarPeriodo não encontrado');
const BLOCO = SRC.slice(BLOCO_INI, _bfi + BLOCO_FIM_MARK.length);

const F_ISO = extrairFunc(SRC, '_relatoriosIsoDateOnly');
const F_ADD = extrairFunc(SRC, '_relatoriosAddDaysIso');
const F_RESOLVE = extrairFunc(SRC, '_relatoriosResolveDateRange');

const host = (v) => JSON.parse(JSON.stringify(v));

// Roda o bloco real com um `req.query` e um conjunto de linhas; devolve os ids
// que sobreviveram ao filtro (ou todas as linhas quando `semFiltro`).
function rodar(query, rows) {
  const ctx = { console: { log() {}, warn() {}, error() {} }, req: { query: query || {} } };
  vm.createContext(ctx);
  vm.runInContext(
    [
      F_ISO, F_ADD, F_RESOLVE, BLOCO,
      ';(function () {',
      'var __rows = ' + JSON.stringify(rows) + ';',
      'var __sel = semFiltro ? __rows : filtrarPeriodo(__rows, requestedPeriodo, mes, ano);',
      'globalThis.__out = __sel.map(function (r) { return r.id; });',
      'globalThis.__semFiltro = semFiltro;',
      'globalThis.__range = { inicio: rangeInicio, fimInclusivo: rangeFimInclusivo, fimExclusivo: rangeFimExclusivo, has: hasCustomRange };',
      '})();'
    ].join('\n'),
    ctx
  );
  return { ids: host(ctx.__out), semFiltro: ctx.__semFiltro, range: host(ctx.__range) };
}

// Base de linhas: todas com `data` exceto duas (mes_referencia) — out/2026 e ago/2026.
const ROWS = [
  { id: '07out', data: '2026-10-07T09:00:00Z', caixas: 1 },
  { id: '08out_a', data: '2026-10-08T09:00:00Z', caixas: 2 },
  { id: '08out_b', data: '2026-10-08T15:30:00Z', caixas: 3 },
  { id: '09out', data: '2026-10-09T09:00:00Z', caixas: 4 },
  { id: '10out', data: '2026-10-10T09:00:00Z', caixas: 5 },
  { id: '15set', data: '2026-09-15T09:00:00Z', caixas: 6 },
  { id: 'semData_out', mes_referencia: '2026-10', caixas: 7 },
  { id: 'semData_ago', mes_referencia: '2026-08', caixas: 8 }
];

// ── REL-10 · o bug central: 1 dia devolvia o mês inteiro ──────────────────
test('REL-10: filtro de 1 dia (08/10→08/10) devolve só o dia, não o mês', () => {
  const r = rodar({ data_inicio: '2026-10-08', data_fim: '2026-10-08' }, ROWS);
  assert.equal(r.range.has, true);
  assert.equal(r.range.inicio, '2026-10-08');
  assert.equal(r.range.fimInclusivo, '2026-10-08'); // fim INCLUSIVO
  // Só os dois registros do dia 08 (e a linha sem data do mês corrente).
  assert.deepEqual(r.ids.sort(), ['08out_a', '08out_b', 'semData_out'].sort());
});

test('REL-10: a data final é INCLUSIVA (regressão do `d < customFimDate`)', () => {
  const r = rodar({ data_inicio: '2026-10-07', data_fim: '2026-10-08' }, ROWS);
  assert.deepEqual(r.ids.sort(), ['07out', '08out_a', '08out_b', 'semData_out'].sort());
});

test('REL-10: período de 2 dias inclui as duas pontas e exclui a de fora', () => {
  const r = rodar({ data_inicio: '2026-10-08', data_fim: '2026-10-09' }, ROWS);
  assert.deepEqual(r.ids.sort(), ['08out_a', '08out_b', '09out', 'semData_out'].sort());
  assert.ok(!r.ids.includes('10out'), 'não pode incluir 10/10');
  assert.ok(!r.ids.includes('07out'), 'não pode incluir 07/10');
});

// ── mes_referencia só para linhas SEM data ────────────────────────────────
test('REL-10: linha sem `data` entra pelo mês do período; mês distante fica fora', () => {
  const r = rodar({ data_inicio: '2026-10-08', data_fim: '2026-10-08' }, ROWS);
  assert.ok(r.ids.includes('semData_out'), 'linha sem data do mês do período deve entrar');
  assert.ok(!r.ids.includes('semData_ago'), 'linha sem data de outro mês deve sair');
});

// ── mês 09 não pode mudar ─────────────────────────────────────────────────
test('REL-10: mês 09/2026 (periodo=mes) mantém o comportamento por mês', () => {
  const r = rodar({ periodo: 'mes', mes: '9', ano: '2026' }, ROWS);
  assert.equal(r.range.has, true); // defaultCurrentMonth gera range 01/09→30/09
  assert.equal(r.range.inicio, '2026-09-01');
  assert.equal(r.range.fimInclusivo, '2026-09-30');
  assert.deepEqual(r.ids, ['15set']);
  assert.ok(!r.ids.includes('07out'), 'outubro não pode aparecer em setembro');
});

// ── sem filtro ────────────────────────────────────────────────────────────
test('REL-10: todos=true devolve tudo, ignorando o período', () => {
  const r = rodar({ todos: 'true', data_inicio: '2026-10-08', data_fim: '2026-10-08' }, ROWS);
  assert.equal(r.semFiltro, true);
  assert.equal(r.ids.length, ROWS.length);
});

// ── guardas estáticas na rota real ────────────────────────────────────────
test('REL-10: server.js usa rowDateIso e rangeFimInclusivo nas DUAS rotas', () => {
  const cRow = (SRC.match(/const rowDateIso = \(row\) =>/g) || []).length;
  const cFim = (SRC.match(/const rangeFimInclusivo = customFim \|\| resolvedRange\?\.fim \|\| '';/g) || []).length;
  const cCmp = (SRC.match(/okFim = !rangeFimInclusivo \|\| dIso <= rangeFimInclusivo;/g) || []).length;
  assert.equal(cRow, 2, 'rowDateIso deve existir nas 2 rotas');
  assert.equal(cFim, 2, 'rangeFimInclusivo deve existir nas 2 rotas');
  assert.equal(cCmp, 2, 'comparação inclusiva deve existir nas 2 rotas');
  // Sem a comparação exclusiva antiga (ignora comentários).
  const codigo = BLOCO.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
  assert.ok(!/d < customFimDate/.test(codigo), 'não pode restar a comparação exclusiva antiga');
});
