'use strict';
// OFMAQ-04 · "Passou pela máquina" deixa a OF presa e pula etapas (alto)
//
// Defeito (prompt OFMAQ-04, linhas 481-501):
//   - a rota gravava `passou_maquina=true` sem mudar o status: a OF sumia de todas
//     as filas (isPassedMachine) e continuava "Em aberto" — 12 OFs presas
//     (PCP/Dashboard 397 x OFMAQ 385);
//   - `marca()` tinha `if (matchNome || true)`, marcando TODAS as etapas do fluxo;
//   - `_ofActionClearFlags` gravava `observacoes`, coluna que não existe em `ofs`;
//   - `activeOfRow` mostrava a OF na máquina antiga (of.maquina) em vez da etapa
//     atual do fluxo.
//
// Correção (verificada aqui com código real, sem banco e sem servidor):
//   1) `_ofActionClearFlags` não escreve mais em `observacoes`;
//   2) bloco de decisão de etapa da rota `POST /api/ofs/:id/passou-maquina`,
//      extraído do server.js e executado num contexto `vm`:
//        - etapa intermediária → `maquina_atual_index + 1` + `maquina_agendada =
//          fluxo[idx]`, SEM `passou_maquina`;
//        - última etapa / OF sem fluxo → `passou_maquina = true` + `passou_em`;
//        - marca somente a etapa que passou (fluxo de objetos);
//   3) `resolveMachine`/`fluxoEtapaAtual` do patch.js (extraídos do IIFE canônico
//      e rodados em `vm`) passam a exibir a ETAPA ATUAL do fluxo;
//   4) `markPassed` do front só remove a OF da fila e propaga `passou_maquina`
//      quando o fluxo terminou;
//   5) a migração `migrations/pendentes/D2_ofs_presas.sql` existe e traz ROLLBACK.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const SERVER = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const PATCH = fs.readFileSync(path.join(ROOT, 'patch.js'), 'utf8');

// ── helpers de extração ─────────────────────────────────────────────────────
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

function extrairEntre(src, inicio, fim) {
  const i = src.indexOf(inicio);
  assert.ok(i >= 0, 'não achei o início: ' + inicio);
  const j = src.indexOf(fim, i + inicio.length);
  assert.ok(j > i, 'não achei o fim: ' + fim);
  return src.slice(i, j);
}

function semComentarios(s) {
  return String(s).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

// ── 1. bloco de decisão de etapa da rota (server.js) ───────────────────────
const BLOCO_ETAPA = extrairEntre(
  SERVER,
  'const nomeEtapa = (i) => {',
  '__dbg.maquina_resolvida = maquinaNome || null;'
);

function rodarEtapa(fluxo, idx, maquina) {
  const ctx = vm.createContext({ console: { log() {}, warn() {}, error() {} } });
  vm.runInContext('var _ofActionClearFlags = function () {};', ctx);
  const src = '(function () {'
    + 'var of = { id: "of-teste" };'
    + 'var novoIdx = ' + Number(idx) + ';'
    + 'var maquinaNome = ' + JSON.stringify(String(maquina)) + ';'
    + 'var nowIso = "2026-10-21T12:00:00.000Z";'
    + 'var fluxoArr = ' + JSON.stringify(fluxo || []) + ';'
    + 'var isFluxoObj = fluxoArr.some(function (x) { return x && typeof x === "object" && !Array.isArray(x); });'
    + BLOCO_ETAPA
    + 'return { updatePayload: updatePayload, fluxoArr: fluxoArr, idxAtual: idxAtual, isLastStep: isLastStep, proxIdx: proxIdx };'
    + '})()';
  return vm.runInContext(src, ctx);
}

const FLUXO_STR = ['IMP 01', 'CORTE VINCO ROTATIVA'];

// ── 2. funções de máquina do front (patch.js, IIFE canônico) ───────────────
const CANON_START = PATCH.indexOf('function patchOfmaqFinalCanonical');
assert.ok(CANON_START >= 0, 'não achei patchOfmaqFinalCanonical');
const CANON = PATCH.slice(CANON_START);

const FNS_MAQ = [
  'function normText(v)',
  'function normalizeMachine(raw)',
  'function parseMaqArray(value)',
  'function fluxoEtapaAtual(of)',
  'function resolveMachine(of)',
].map((m) => extrairFuncao(CANON, m)).join('\n');

function montarMaq() {
  const ctx = vm.createContext({ console, window: {} });
  vm.runInContext("var _YY2_LABEL_SEM_MAQUINA = 'Sem Máquina Definida';", ctx);
  vm.runInContext(FNS_MAQ, ctx);
  vm.runInContext('globalThis.__maq = { resolveMachine: resolveMachine, fluxoEtapaAtual: fluxoEtapaAtual, normalizeMachine: normalizeMachine };', ctx);
  return ctx.__maq;
}

// ── SERVIDOR · _ofActionClearFlags ─────────────────────────────────────────
test('OFMAQ-04: _ofActionClearFlags não grava mais em `observacoes`', () => {
  const corpo = semComentarios(extrairFuncao(SERVER, 'function _ofActionClearFlags(of, upd, motivoAcao, nowIso)'));
  assert.ok(!/\bobservacoes\b/.test(corpo), '_ofActionClearFlags ainda escreve em observacoes (coluna inexistente em ofs)');
  assert.ok(/upd\.obs\s*=/.test(corpo), '_ofActionClearFlags não grava mais em upd.obs');
});

test('OFMAQ-04: rota passou-maquina sem `matchNome || true`', () => {
  const trecho = semComentarios(extrairEntre(SERVER, 'const nomeEtapa = (i) => {', '__dbg.maquina_resolvida = maquinaNome || null;'));
  assert.ok(!/matchNome\s*\|\|\s*true/.test(trecho), 'ainda existe `matchNome || true` (marcava todas as etapas)');
  assert.ok(/if \(matchNome\) \{/.test(trecho), 'faltou `if (matchNome) {` no marca()');
});

// ── SERVIDOR · etapa intermediária x última etapa ──────────────────────────
test('OFMAQ-04: etapa intermediária avança para a próxima máquina sem passou_maquina', () => {
  const r = rodarEtapa(FLUXO_STR, 0, 'IMP 01');
  assert.equal(r.isLastStep, false, 'fluxo de 2 etapas na 1ª não pode ser a última');
  assert.equal(r.updatePayload.maquina_atual_index, 1, 'maquina_atual_index deveria avançar para 1');
  assert.equal(r.updatePayload.maquina_agendada, 'CORTE VINCO ROTATIVA', 'maquina_agendada deveria ser a próxima etapa');
  assert.ok(r.updatePayload.passou_maquina === undefined, 'etapa intermediária não pode gravar passou_maquina');
  assert.ok(r.updatePayload.passou_em === undefined, 'etapa intermediária não pode gravar passou_em');
  assert.equal(r.updatePayload.passou_maquina_nome, 'IMP 01', 'passou_maquina_nome deveria registrar a máquina que passou');
});

test('OFMAQ-04: última etapa do fluxo conclui (passou_maquina=true)', () => {
  const r = rodarEtapa(FLUXO_STR, 1, 'CORTE VINCO ROTATIVA');
  assert.equal(r.isLastStep, true, 'a 2ª de 2 etapas é a última');
  assert.equal(r.updatePayload.passou_maquina, true, 'última etapa deveria gravar passou_maquina=true');
  assert.equal(r.updatePayload.passou_em, '2026-10-21T12:00:00.000Z', 'última etapa deveria gravar passou_em');
  assert.equal(r.updatePayload.maquina_atual_index, 1, 'maquina_atual_index deveria permanecer na última etapa');
  assert.ok(r.updatePayload.maquina_agendada === undefined, 'última etapa não deve reescrever maquina_agendada');
});

test('OFMAQ-04: OF sem fluxo mantém o comportamento de sempre (conclui)', () => {
  const r = rodarEtapa([], 0, 'IMP 03');
  assert.equal(r.isLastStep, true, 'OF sem fluxo é sempre última etapa');
  assert.equal(r.updatePayload.passou_maquina, true, 'OF sem fluxo deveria continuar gravando passou_maquina=true');
  assert.equal(r.updatePayload.maquina_atual_index, 0);
});

test('OFMAQ-04: fluxo de objetos marca SOMENTE a etapa que passou', () => {
  const fluxo = [
    { nome: 'IMP 01', col: 'imp01' },
    { nome: 'CORTE VINCO ROTATIVA', col: 'cvr' },
  ];
  const r = rodarEtapa(fluxo, 0, 'IMP 01');
  assert.equal(r.fluxoArr[0].passou, true, 'a etapa atual (IMP 01) deveria ser marcada');
  assert.equal(r.fluxoArr[0].baixa, true, 'a etapa atual (IMP 01) deveria receber baixa');
  assert.equal(r.fluxoArr[0].data_passou, '2026-10-21T12:00:00.000Z');
  assert.ok(r.fluxoArr[1].passou === undefined, 'a etapa seguinte (CORTE VINCO) NÃO pode ser marcada');
  assert.ok(r.fluxoArr[1].baixa === undefined, 'a etapa seguinte (CORTE VINCO) NÃO pode receber baixa');
  assert.equal(r.updatePayload.maquina_atual_index, 1, 'deveria avançar para a etapa seguinte');
  assert.equal(r.updatePayload.maquina_agendada, 'CORTE VINCO ROTATIVA');
  assert.ok(r.updatePayload.passou_maquina === undefined, 'OF ainda na fila: sem passou_maquina');
});

// ── FRONT · resolveMachine mostra a etapa atual do fluxo ───────────────────
test('OFMAQ-04: resolveMachine mostra a etapa ATUAL do fluxo (não of.maquina)', () => {
  const api = montarMaq();
  const of = { maquina: 'IMP 01', maquina_atual_index: 1, fluxo_maquinas: FLUXO_STR };
  assert.equal(api.resolveMachine(of), 'CORTE VINCO ROTATIVA');
  assert.equal(api.fluxoEtapaAtual(of), 'CORTE VINCO ROTATIVA');
});

test('OFMAQ-04: resolveMachine na 1ª etapa do fluxo = primeira máquina', () => {
  const api = montarMaq();
  const of = { maquina: 'IMP 05', maquina_atual_index: 0, fluxo_maquinas: FLUXO_STR };
  assert.equal(api.resolveMachine(of), 'IMP 01');
});

test('OFMAQ-04: resolveMachine aceita fluxo em string JSON e objetos {nome}', () => {
  const api = montarMaq();
  assert.equal(api.resolveMachine({ maquina: 'IMP 01', maquina_atual_index: 1, fluxo_maquinas: JSON.stringify(FLUXO_STR) }), 'CORTE VINCO ROTATIVA');
  assert.equal(api.resolveMachine({ maquina: 'IMP 01', maquina_atual_index: 1, fluxo_maquinas: [{ nome: 'IMP 01' }, { nome: 'CORTE VINCO ROTATIVA' }] }), 'CORTE VINCO ROTATIVA');
  assert.equal(api.resolveMachine({ maquina: 'IMP 01', maquina_atual_index: 1, fluxo_maquinas: [{ maquina: 'IMP 01' }, { maquina: 'CORTE VINCO ROTATIVA' }] }), 'CORTE VINCO ROTATIVA');
});

test('OFMAQ-04: resolveMachine cai no fallback sem fluxo e com etapa desconhecida', () => {
  const api = montarMaq();
  assert.equal(api.resolveMachine({ maquina: 'IMP 05' }), 'IMP 05', 'sem fluxo deve usar of.maquina');
  assert.equal(api.resolveMachine({ maquina: 'IMP 05', maquina_atual_index: 0, fluxo_maquinas: ['ROBÔ NOVO'] }), 'IMP 05', 'etapa fora das máquinas do OFMAQ não pode virar "Sem Máquina Definida"');
  assert.equal(api.resolveMachine({ maquina: 'IMP 03', maquina_atual_index: 9, fluxo_maquinas: FLUXO_STR }), 'CORTE VINCO ROTATIVA', 'índice fora do range deve ser limitado ao fim do fluxo');
});

test('OFMAQ-04: activeOfRow usa resolveMachine (máquina da linha = etapa do fluxo)', () => {
  const corpo = semComentarios(extrairFuncao(CANON, 'function activeOfRow(of, idx)'));
  assert.ok(/normalizeMachine\(resolveMachine\(of\)\)/.test(corpo), 'activeOfRow não deriva a máquina de resolveMachine');
  assert.ok(/isPassedMachine\(of\)/.test(corpo), 'activeOfRow deve continuar escondendo OF que já passou pela máquina');
});

// ── FRONT · markPassed respeita a etapa ────────────────────────────────────
test('OFMAQ-04: markPassed não fecha a OF numa etapa intermediária', () => {
  const corpo = semComentarios(extrairFuncao(PATCH, 'async function markPassed(id, machine)'));
  const iInter = corpo.indexOf('if (!_finalizou) {');
  const iFinal = corpo.indexOf('if (_finalizou) {');
  assert.ok(iInter >= 0, 'markPassed sem o ramo de etapa intermediária (!_finalizou)');
  assert.ok(iFinal > iInter, 'markPassed sem o ramo de conclusão (_finalizou)');
  const ramoInter = corpo.slice(iInter, iFinal);
  assert.ok(!/passou_maquina\s*=\s*true/.test(ramoInter), 'etapa intermediária ainda marca passou_maquina=true');
  assert.ok(/maquina_atual_index/.test(ramoInter), 'etapa intermediária não propaga maquina_atual_index');
  assert.ok(/maquina_agendada/.test(ramoInter), 'etapa intermediária não propaga maquina_agendada');
  assert.ok(/activeOfRow\(/.test(ramoInter), 'etapa intermediária não reposiciona a OF na nova máquina');
  const ramoFinal = corpo.slice(iFinal);
  assert.ok(/state\.rowsData = state\.rowsData\.filter/.test(ramoFinal), 'conclusão não remove a OF da fila');
  assert.ok(/o\.passou_maquina = true/.test(ramoFinal), 'conclusão não propaga passou_maquina para os caches');
});

// ── MIGRAÇÃO · D2_ofs_presas.sql (preparada, NÃO executada) ────────────────
test('OFMAQ-04: migração D2_ofs_presas.sql existe e não executa nada (ROLLBACK)', () => {
  const p = path.join(ROOT, 'migrations', 'pendentes', 'D2_ofs_presas.sql');
  assert.ok(fs.existsSync(p), 'faltou migrations/pendentes/D2_ofs_presas.sql');
  const sql = fs.readFileSync(p, 'utf8');
  assert.ok(/ROLLBACK;/.test(sql), 'D2_ofs_presas.sql precisa do ROLLBACK');
  assert.ok(/BEGIN;/.test(sql), 'D2_ofs_presas.sql precisa abrir transação');
  assert.ok(/COALESCE\(o\.passou_maquina, false\) = true/.test(sql), 'D2_ofs_presas.sql precisa filtrar passou_maquina=true');
  assert.ok(/o\.status = 'Em aberto'/.test(sql), 'D2_ofs_presas.sql precisa filtrar status Em aberto');
  const numeros = ['798', '540', '539', '318', '537', '317', '419', '316', '2745', '1174', '473', '273'];
  for (const n of numeros) assert.ok(sql.indexOf("'" + n + "'") >= 0, 'D2_ofs_presas.sql sem a OF nº ' + n);
  assert.ok(/NÃO EXECUTAR/.test(sql), 'D2_ofs_presas.sql precisa avisar que não deve ser executada');
});
