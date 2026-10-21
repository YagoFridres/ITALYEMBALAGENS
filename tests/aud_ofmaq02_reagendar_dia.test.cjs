'use strict';
// OFMAQ-02 · "Alterar data" reagenda o dia de PRODUÇÃO — nunca o prazo do cliente.
//
// Defeito (prompt OFMAQ-02, crítico):
//   - As ações de reagendar ("Alterar data", "Mover máquina + data", zero-kanban e
//     o modal legado) enviavam `{ data_entrega, ent }`, ou seja, mexer no dia de
//     produção mudava a DATA DE ENTREGA prometida ao cliente.
//   - No servidor, `normalizeOfUpdateBody` copiava `data_entrega` → `dia`, então um
//     reagendamento de produção contaminava o dia e vice-versa.
//
// Correção:
//   - payload de reagendar passa a ser `{ dia, data_producao, dia_programacao }`;
//   - `normalizeOfUpdateBody` só deriva `dia` de `data_entrega` quando o corpo NÃO
//     traz `dia` explicitamente, e nunca propaga `dia` → `data_entrega`/`ent`.
//
// Sem navegador, sem servidor, sem banco: extrai o trecho real do front e roda o
// normalizador real do servidor num contexto `vm`.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const PATCH = fs.readFileSync(path.join(ROOT, 'patch.js'), 'utf8');
const SERVER = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');

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

// ── Grupo A · fonte do front: payloads de reagendamento ─────────────────────
// Cada payload de reagendar precisa mandar o dia de produção e NÃO tocar na
// entrega. Testamos por função, com o corpo real (chaves balanceadas).

function semComentarios(txt) {
  return txt.replace(/\/\/[^\n]*/g, '');
}

function corpoPATCH(marcador) {
  return semComentarios(extrairFuncao(PATCH, marcador));
}

test('OFMAQ-02: updateDate manda dia/data_producao/dia_programacao e não data_entrega/ent', () => {
  const bloco = corpoPATCH('async function updateDate(id, value)');
  assert.ok(/var bodySent = \{[^}]*\bdia: value\b[^}]*\}/.test(bloco), 'updateDate sem dia: value');
  assert.ok(/data_producao: value/.test(bloco), 'updateDate sem data_producao');
  assert.ok(/dia_programacao: value/.test(bloco), 'updateDate sem dia_programacao');
  assert.ok(!/data_entrega: value/.test(bloco), 'updateDate ainda envia data_entrega');
  assert.ok(!/\bent: value\b/.test(bloco), 'updateDate ainda envia ent');
});

test('OFMAQ-02: moveRowAndDate manda dia/data_producao/dia_programacao e não data_entrega/ent', () => {
  const bloco = corpoPATCH('async function moveRowAndDate(id, machine, value)');
  assert.ok(/\bdia: value\b/.test(bloco), 'moveRowAndDate sem dia: value');
  assert.ok(/data_producao: value/.test(bloco), 'moveRowAndDate sem data_producao');
  assert.ok(/dia_programacao: value/.test(bloco), 'moveRowAndDate sem dia_programacao');
  assert.ok(!/data_entrega: value/.test(bloco), 'moveRowAndDate ainda envia data_entrega');
  assert.ok(!/\bent: value\b/.test(bloco), 'moveRowAndDate ainda envia ent');
});

test('OFMAQ-02: openAlterarMaquinaPatched (alterarData) grava o dia de produção', () => {
  const bloco = corpoPATCH('async function openAlterarMaquinaPatched(ofId, ofNum)');
  const i = bloco.indexOf('if (alterarData && novaData)');
  assert.ok(i >= 0, 'não achei o bloco alterarData');
  const trecho = bloco.slice(i, i + 400);
  assert.ok(/payload\.dia = novaData/.test(trecho), 'não grava payload.dia');
  assert.ok(/payload\.data_producao = novaData/.test(trecho), 'não grava payload.data_producao');
  assert.ok(/payload\.dia_programacao = novaData/.test(trecho), 'não grava payload.dia_programacao');
  assert.ok(!/payload\.data_entrega/.test(trecho), 'ainda grava payload.data_entrega');
  assert.ok(!/payload\.ent\b/.test(trecho), 'ainda grava payload.ent');
});

test('OFMAQ-02: openAlterarDataPatched grava o dia de produção e preserva a entrega', () => {
  const bloco = corpoPATCH('async function openAlterarDataPatched(ofId, ofNum, dataAtual)');
  const i = bloco.indexOf('var payload = {');
  assert.ok(i >= 0, 'não achei o payload do modal de data');
  const trecho = bloco.slice(i, i + 400);
  assert.ok(/\bdia: novaData/.test(trecho), 'payload sem dia');
  assert.ok(/data_producao: novaData/.test(trecho), 'payload sem data_producao');
  assert.ok(/dia_programacao: novaData/.test(trecho), 'payload sem dia_programacao');
  assert.ok(!/data_entrega: novaData/.test(trecho), 'ainda usa data_entrega: novaData');
  assert.ok(!/\bent: novaData\b/.test(trecho), 'ainda usa ent: novaData');
});

test('OFMAQ-02: zero-kanban (openDateModal/moveRowAndDateZero) grava o dia de produção', () => {
  const a = corpoPATCH('function openDateModal(id)');
  assert.ok(/var bodySent = \{[^}]*\bdia: value\b[^}]*\}/.test(a), 'openDateModal sem dia: value');
  assert.ok(!/data_entrega: value/.test(a), 'openDateModal ainda envia data_entrega');
  const b = corpoPATCH('async function moveRowAndDateZero(id, machine, value)');
  assert.ok(/\bdia: value\b/.test(b), 'moveRowAndDateZero sem dia: value');
  assert.ok(/data_producao: value/.test(b), 'moveRowAndDateZero sem data_producao');
  assert.ok(/dia_programacao: value/.test(b), 'moveRowAndDateZero sem dia_programacao');
  assert.ok(!/data_entrega: value/.test(b), 'moveRowAndDateZero ainda envia data_entrega');
  assert.ok(!/\bent: value\b/.test(b), 'moveRowAndDateZero ainda envia ent');
});

test('OFMAQ-02: nenhum reagendamento no patch.js envia data_entrega/ent como valor', () => {
  assert.ok(!/data_entrega: value/.test(PATCH), 'sobrou data_entrega: value no patch.js');
  assert.ok(!/\bent: value\b/.test(PATCH), 'sobrou ent: value no patch.js');
  assert.ok(!/payload\.data_entrega = /.test(PATCH), 'sobrou payload.data_entrega = no patch.js');
  assert.ok(!/payload\.ent = /.test(PATCH), 'sobrou payload.ent = no patch.js');
});

// ── Grupo B · comportamento do servidor: normalizeOfUpdateBody ──────────────
const NORM = [
  extrairFuncao(SERVER, 'function sanitizeOfUpdatePayload(input)'),
  extrairFuncao(SERVER, 'function _canonicalizarStatusOf(value)'),
  extrairFuncao(SERVER, 'function _chapasBool(v)'),
  extrairFuncao(SERVER, 'function normalizeOfUpdateBody(input)'),
].join('\n');

function montarNorm() {
  const ctx = vm.createContext({ console });
  vm.runInContext(NORM, ctx);
  vm.runInContext('globalThis.__n = { normalizeOfUpdateBody };', ctx);
  return ctx.__n.normalizeOfUpdateBody;
}

const normalize = montarNorm();

test('OFMAQ-02: corpo de reagendamento (dia) não inventa data_entrega/ent', () => {
  const out = normalize({ dia: '2026-11-01', data_producao: '2026-11-01', dia_programacao: '2026-11-01' });
  assert.equal(out.dia, '2026-11-01');
  assert.equal(out.data_producao, '2026-11-01');
  assert.equal(out.dia_programacao, '2026-11-01');
  assert.ok(!('data_entrega' in out), 'reagendar produção criou data_entrega');
  assert.ok(!('ent' in out), 'reagendar produção criou ent');
});

test('OFMAQ-02: corpo antigo (só data_entrega/ent) segue derivando dia', () => {
  const out = normalize({ data_entrega: '2026-11-05', ent: '2026-11-05' });
  assert.equal(out.data_entrega, '2026-11-05');
  assert.equal(out.ent, '2026-11-05');
  assert.equal(out.dia, '2026-11-05', 'compatibilidade legada: data_entrega → dia quando não há dia');
});

test('OFMAQ-02: corpo com dia explícito não é sobrescrito pela entrega', () => {
  const out = normalize({ dia: '2026-11-02', data_entrega: '2026-11-05' });
  assert.equal(out.dia, '2026-11-02', 'dia explícito foi sobrescrito por data_entrega');
  assert.equal(out.data_entrega, '2026-11-05');
  assert.equal(out.ent, '2026-11-05', 'data_entrega → ent (espelho) esperado');
});

test('OFMAQ-02: whitelist CAMPOS_OFS_UPDATE cobre os campos de reagendamento', () => {
  const i = SERVER.indexOf('const CAMPOS_OFS_UPDATE = new Set([');
  assert.ok(i >= 0, 'não achei CAMPOS_OFS_UPDATE');
  const j = SERVER.indexOf(']);', i);
  const bloco = SERVER.slice(i, j);
  ['dia', 'data_producao', 'dia_programacao', 'data_entrega', 'ent'].forEach((campo) => {
    assert.ok(new RegExp("'" + campo + "'").test(bloco), 'whitelist sem ' + campo);
  });
});
