'use strict';
// OFMAQ-01 · A fila de "OFs por Máquina" pertence ao dia PROGRAMADO de produção
// (dia_programacao || dia || data_producao) — nunca à data de entrega do cliente.
//
// Defeito (prompt OFMAQ-01, crítico):
//   - resolveDisplayDate escolhia a data na ordem `dia_programacao → data_entrega → ent → ...`
//     e qualquer data passada virava "hoje". Resultado: a fila separava as OFs pela
//     data de ENTRADA em vez do dia de produção e escondia as atrasadas.
//   - urgenciaTipo comparava a data JÁ AJUSTADA (prazoIso), então nenhuma OF com
//     entrega vencida aparecia ATRASADA.
//
// Correção:
//   - resolveDisplayDate sem `data_entrega` e `ent`;
//   - urgenciaTipo(of) medindo o atraso pela DATA DE ENTREGA via F-5
//     (window._ofClassificaUrgencia);
//   - coluna "Entrega" ao lado de "Dia Agendado (Produção)".
//
// Este teste extrai as funções reais do patch.js e as roda num contexto `vm`
// (sem navegador, sem servidor, sem tocar no banco).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const PATCH = fs.readFileSync(path.join(ROOT, 'patch.js'), 'utf8');

// ── extração de funções reais do fonte ──────────────────────────────────────
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

// Fatia a partir do IIFE canônico do OFMAQ, para pegar as definições CERTAS
// (há funções homônimas legadas antes dele).
const CANON_START = PATCH.indexOf('function patchOfmaqFinalCanonical');
assert.ok(CANON_START >= 0, 'não achei patchOfmaqFinalCanonical');
const CANON = PATCH.slice(CANON_START);

const F5 = extrairFuncao(PATCH, 'window._ofClassificaUrgencia = function');
const FNS = [
  'function normText(v)',
  'function pad2(v)',
  'function parseIso(iso)',
  'function isoFromDate(d)',
  'function currentBusinessDate()',
  'function isClosedStatus(status)',
  'function isPassedMachine(of)',
  'function nextBusinessIsoFrom(baseDate)',
  'function resolveDisplayDate(of)',
  'function urgenciaTipo(of)',
].map((m) => extrairFuncao(CANON, m)).join('\n');

function montarVm() {
  const ctx = vm.createContext({ console, window: {} });
  vm.runInContext(F5 + '\n' + FNS, ctx);
  vm.runInContext('globalThis.__api = { resolveDisplayDate, urgenciaTipo, isoFromDate, currentBusinessDate, isClosedStatus, isPassedMachine };', ctx);
  return ctx.__api;
}

// hoje canônico (mesma lógica do patch: pula fim de semana)
function addDias(iso, n) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const api = montarVm();
const HOJE = api.isoFromDate(api.currentBusinessDate());
const ONTEM = addDias(HOJE, -1);
const AMANHA = addDias(HOJE, 1);

// ── 1. Fonte: resolveDisplayDate não usa mais data_entrega/ent ──────────────
test('OFMAQ-01: resolveDisplayDate não referencia data_entrega nem ent', () => {
  const bloco = CANON.slice(CANON.indexOf('function resolveDisplayDate(of)'));
  const corpo = bloco.slice(0, bloco.indexOf('\n    }'));
  assert.ok(!/\bdata_entrega\b/.test(corpo), 'resolveDisplayDate ainda usa data_entrega');
  assert.ok(!/\bent\b/.test(corpo), 'resolveDisplayDate ainda usa ent');
  assert.ok(/dia_programacao/.test(corpo) && /\bdata_producao\b/.test(corpo), 'resolveDisplayDate perdeu os campos de produção');
});

// ── 2. Fonte: urgenciaTipo usa F-5 e perdeu o parâmetro prazoIso ────────────
test('OFMAQ-01: urgenciaTipo mede atraso pela data de entrega via F-5', () => {
  assert.ok(/window\._ofClassificaUrgencia/.test(CANON), 'urgenciaTipo não usa F-5');
  assert.ok(/function urgenciaTipo\(of\)/.test(CANON), 'urgenciaTipo deveria ser urgenciaTipo(of)');
  assert.ok(!/urgenciaTipo\(of, prazoIso\)/.test(CANON), 'call site antigo com prazoIso sobrou');
  assert.ok(!/urgenciaTipo\(row\.ofRaw \|\| row, row\.prazoIso\)/.test(CANON), 'call site antigo com prazoIso sobrou');
});

// ── 3. Fonte: coluna "Entrega" ao lado de "Dia Agendado (Produção)" ─────────
test('OFMAQ-01: thead traz "Dia Agendado (Produção)" e "Data Entrega" adjacentes', () => {
  const esperado = '<th>Dia Agendado<br><small style="font-weight:400;color:#64748b">Produção</small></th>'
    + '<th>Data Entrega<br><small style="font-weight:400;color:#64748b">Cliente Real</small></th>';
  assert.ok(PATCH.includes(esperado), 'cabeçalho de Produção/Entrega não está adjacente');
});

test('OFMAQ-01: linha mostra produção e entrega separadas (fontes distintas)', () => {
  const i = CANON.indexOf('function rowHtml(item)');
  const bloco = CANON.slice(i, i + 6000);
  assert.ok(/dataEntregaRealRaw = raw && raw\.data_entrega/.test(bloco), 'coluna Entrega não lê data_entrega (cliente real)');
  assert.ok(/var diaAgendadoIso = item\.prazoIso/.test(bloco), 'coluna Dia Agendado não usa o dia de produção (prazoIso)');
  const ia = bloco.indexOf("'<td>' + diaAgendadoBR + '</td>'");
  const ib = bloco.indexOf("'<td>' + dataEntregaRealBR + '</td>'");
  assert.ok(ia >= 0 && ib >= 0 && ia < ib, 'ordem das colunas Produção → Entrega incorreta');
});

// ── 4. Comportamento: dia da fila = dia programado de produção ──────────────
test('OFMAQ-01: OF com dia=hoje e entrega hoje+5 aparece hoje e é NORMAL', () => {
  const of = { dia: HOJE, data_entrega: addDias(HOJE, 5) };
  assert.equal(api.resolveDisplayDate(of), HOJE);
  assert.equal(api.urgenciaTipo(of), 'normal');
});

test('OFMAQ-01: OF com dia=hoje e entrega ontem aparece hoje e é ATRASADA', () => {
  const of = { dia: HOJE, data_entrega: ONTEM };
  assert.equal(api.resolveDisplayDate(of), HOJE);
  assert.equal(api.urgenciaTipo(of), 'atrasada');
});

test('OFMAQ-01: data de entrega NÃO define o dia da fila', () => {
  // só data_entrega (sem dia de produção) → não entra na fila por ela
  assert.equal(api.resolveDisplayDate({ data_entrega: HOJE }), '');
  assert.equal(api.resolveDisplayDate({ ent: HOJE }), '');
});

test('OFMAQ-01: OF aberta com dia programado no passado cai em "hoje"', () => {
  assert.equal(api.resolveDisplayDate({ dia_programacao: ONTEM }), HOJE);
  assert.equal(api.resolveDisplayDate({ dia: addDias(HOJE, -10) }), HOJE);
});

test('OFMAQ-01: dia programado (produção) vence a data de entrega futura', () => {
  // escolhe uma segunda-feira futura (dia útil → nextBusinessIsoFrom é no-op)
  let W = addDias(HOJE, 7);
  while (new Date(W + 'T00:00:00Z').getUTCDay() !== 1) W = addDias(W, 1);
  const entrega = addDias(W, 2);
  assert.equal(api.resolveDisplayDate({ dia_programacao: W, data_entrega: entrega }), W);
});

// ── 5. Soma dos botões "hoje" = OFs com produção <= hoje ────────────────────
// Replica o filtro de activeOfRow (tem máquina, não concluída, não passou) e a
// contabilização de countsByDay (agrupa por resolveDisplayDate).
test('OFMAQ-01: total no dia "hoje" = OFs abertas com produção <= hoje', () => {
  const ofs = [
    { id: 'a', maquina: 'M1', dia: HOJE, data_entrega: addDias(HOJE, 5) },       // hoje
    { id: 'b', maquina: 'M2', dia: addDias(HOJE, -3), data_entrega: ONTEM },      // passado → hoje, atrasada
    { id: 'c', maquina: 'M1', dia_programacao: HOJE, dia: addDias(HOJE, 4) },     // dia_programacao vence → hoje
    { id: 'd', maquina: 'M2', dia: addDias(HOJE, 20), data_entrega: AMANHA },     // futuro
    { id: 'e', maquina: 'M1', data_entrega: ONTEM },                              // sem dia de produção → fora
    { id: 'f', maquina: 'M1', dia: ONTEM, passou_maquina: true },                 // passou → fora
    { id: 'g', maquina: 'M2', dia: ONTEM, status: 'Concluída' },                  // fechada → fora
  ];
  const ativos = ofs.filter((o) => o.maquina && !api.isClosedStatus(o.status) && !api.isPassedMachine(o));
  const naFilaHoje = ativos.filter((o) => api.resolveDisplayDate(o) === HOJE).map((o) => o.id).sort();
  const prodIso = (o) => String(o.dia_programacao || o.dia || o.data_producao || '').slice(0, 10);
  const esperado = ativos
    .filter((o) => /^\d{4}-\d{2}-\d{2}$/.test(prodIso(o)) && prodIso(o) <= HOJE)
    .map((o) => o.id).sort();
  assert.deepEqual(naFilaHoje, esperado);
  assert.deepEqual(naFilaHoje, ['a', 'b', 'c']);
});
