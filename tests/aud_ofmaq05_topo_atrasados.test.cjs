'use strict';
// OFMAQ-05 · O topo "ATRASADOS" contava outra coisa que não o atraso real.
//
// Defeito (prompt OFMAQ-05, alto):
//   - o topo (patch.js, `_patchUpdateBadges`) contava `status === 'Atrasado'`,
//     que nenhuma OF tem → sempre 0, enquanto o Dashboard mostrava as atrasadas
//     reais;
//   - `/api/dashboard/resumo-ofs` calculava o atraso por diferença de dias com
//     fallback `dia`, numa regra própria.
//
// Correção:
//   - topo ATRASADOS usa a MESMA regra do Dashboard (F-5 `atrasada`);
//   - URGENTES continua sendo a marcação manual (urg/urgente);
//   - `/api/dashboard/resumo-ofs` passa a usar `_ofClassificaUrgencia`.
//
// "Em produção" do PCP: o contador conta status==="Em produção", que é um status
// REAL do sistema — não foi alterado (registrado em `__patchBadgesRuleDoc`).
//
// Roda as funções REAIS de patch.js/server.js em sandbox `vm` (sem navegador,
// sem servidor, sem tocar no banco).
//
// Rodar: node --test tests/aud_ofmaq05_topo_atrasados.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const PATCH = fs.readFileSync(path.join(ROOT, 'patch.js'), 'utf8');
const SERVER = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8').replace(/\r\n/g, '\n');

// ── extractor: equilíbra parênteses do header antes de casar as chaves ──────
function extrairFunc(src, marcador, nome) {
  const i = src.indexOf(marcador);
  assert.ok(i >= 0, 'não achei: ' + marcador);
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
  throw new Error('fim não achado: ' + (nome || marcador));
}

// ── hoje BRT (mesma fórmula usada no topo do patch) ─────────────────────────
function hojeBrtIso() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}
function addDias(iso, n) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const HOJE = hojeBrtIso();
const ONTEM = addDias(HOJE, -1);
const DAQUI_15 = addDias(HOJE, 15);
const DAQUI_2 = addDias(HOJE, 2);

// ═══════════════════════ 1. TOPO (patch.js) ═══════════════════════════════

const F5_PATCH = extrairFunc(PATCH, 'window._ofClassificaUrgencia = function');
const FN_TOPO = [
  extrairFunc(PATCH, 'function _statusAberto(rawSt)'),
  extrairFunc(PATCH, 'function _patchUpdateBadges()'),
].join('\n');

function montarTopo(ofs) {
  const els = {
    'bdg-at': { textContent: '' },
    'bdg-ug': { textContent: '' },
    'bdg-ok': { textContent: '' },
  };
  const ctx = {
    console: { log() {}, warn() {}, error() {} },
    Intl,
    Date,
    document: { getElementById: (id) => els[id] || null },
    window: { OFS: ofs, __patchBadgesLastValid: { at: 0, ug: 0, ok: 0 } },
  };
  vm.createContext(ctx);
  vm.runInContext(F5_PATCH + '\n' + FN_TOPO, ctx);
  vm.runInContext('globalThis.__patchUpdateBadges = _patchUpdateBadges;', ctx);
  ctx.__patchUpdateBadges();
  return {
    at: els['bdg-at'].textContent,
    ug: els['bdg-ug'].textContent,
  };
}

test('OFMAQ-05 topo: OF aberta com entrega vencida conta como ATRASADA', () => {
  const r = montarTopo([
    { id: '1', status: 'Em aberto', data_entrega: ONTEM },
  ]);
  assert.strictEqual(r.at, '1 ATRASADOS');
});

test('OFMAQ-05 topo: OF aberta no prazo não conta como atrasada', () => {
  const r = montarTopo([
    { id: '1', status: 'Em aberto', data_entrega: DAQUI_15 },
  ]);
  assert.strictEqual(r.at, '0 ATRASADOS');
});

test('OFMAQ-05 topo: OF concluída/cancelada com entrega vencida NÃO conta', () => {
  const r = montarTopo([
    { id: '1', status: 'Concluído', data_entrega: ONTEM },
    { id: '2', status: 'Cancelado', data_entrega: ONTEM },
  ]);
  assert.strictEqual(r.at, '0 ATRASADOS');
});

test('OFMAQ-05 topo: URGENTES continua sendo a marcação manual (urg/urgente)', () => {
  const r = montarTopo([
    { id: '1', status: 'Em aberto', data_entrega: DAQUI_15, urg: true },
    { id: '2', status: 'Em aberto', data_entrega: DAQUI_15, urgente: true },
    { id: '3', status: 'Em aberto', data_entrega: DAQUI_15 },
  ]);
  assert.strictEqual(r.ug, '2 URGENTES');
  assert.strictEqual(r.at, '0 ATRASADOS');
});

test('OFMAQ-05 topo: mistura — 2 atrasadas e 1 urgente', () => {
  const r = montarTopo([
    { id: '1', status: 'Em aberto', data_entrega: ONTEM },
    { id: '2', status: 'Em produção', data_entrega: ONTEM },
    { id: '3', status: 'Em aberto', data_entrega: DAQUI_15, urg: true },
  ]);
  assert.strictEqual(r.at, '2 ATRASADOS');
  assert.strictEqual(r.ug, '1 URGENTES');
});

test('OFMAQ-05 topo: fonte não usa mais status==="Atrasado" e usa F-5', () => {
  const corpo = extrairFunc(PATCH, 'function _patchUpdateBadges()');
  // ignora as linhas de comentário (a explicação cita a regra antiga)
  const codigo = corpo.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
  assert.ok(!/'Atrasado'/.test(codigo), 'a contagem ainda referencia status "Atrasado"');
  assert.ok(/_ofClassificaUrgencia\(o, _hojeBrtIso\)/.test(codigo), 'não usa F-5 para o atraso');
});

test('OFMAQ-05: doc de regra registra a pendência do "em produção" do PCP', () => {
  const i = PATCH.indexOf('window.__patchBadgesRuleDoc = {');
  assert.ok(i >= 0, 'não achei __patchBadgesRuleDoc');
  const bloco = PATCH.slice(i, PATCH.indexOf('};', i) + 2);
  assert.ok(/pendenciaEmProducaoPcp/.test(bloco), 'não registrou a pendência do "em produção"');
});

// ═══════════════════ 2. ENDPOINT /api/dashboard/resumo-ofs ═════════════════

const F5_SRV = [
  extrairFunc(SERVER, 'function _spAddDiaIso(iso, n)'),
  extrairFunc(SERVER, 'function _ofClassificaUrgencia(of, hojeIso)'),
].join('\n');

const ctxSrv = { console: { log() {}, warn() {}, error() {} }, Date, Intl };
vm.createContext(ctxSrv);
vm.runInContext(F5_SRV, ctxSrv);
const F5 = (of, hoje) => ctxSrv._ofClassificaUrgencia(of, hoje);

test('OFMAQ-05 server: _ofClassificaUrgencia mede atraso por data_entrega/ent', () => {
  assert.strictEqual(F5({ data_entrega: ONTEM }, HOJE).atrasada, true);
  assert.strictEqual(F5({ ent: ONTEM }, HOJE).atrasada, true);
  assert.strictEqual(F5({ data_entrega: DAQUI_15 }, HOJE).atrasada, false);
});

test('OFMAQ-05 server: vence3 cobre os próximos 3 dias (o que o card chama de "urgentes")', () => {
  assert.strictEqual(F5({ data_entrega: DAQUI_2 }, HOJE).vence3, true);
  assert.strictEqual(F5({ data_entrega: DAQUI_15 }, HOJE).vence3, false);
  assert.strictEqual(F5({ data_entrega: ONTEM }, HOJE).vence3, false);
});

test('OFMAQ-05 server: urgente segue a marcação manual', () => {
  assert.strictEqual(F5({ urg: true, data_entrega: DAQUI_15 }, HOJE).urgente, true);
  assert.strictEqual(F5({ urgente: true }, HOJE).urgente, true);
  assert.strictEqual(F5({ data_entrega: DAQUI_15 }, HOJE).urgente, false);
});

test('OFMAQ-05 server: /api/dashboard/resumo-ofs usa _ofClassificaUrgencia', () => {
  const i = SERVER.indexOf("app.get('/api/dashboard/resumo-ofs'");
  assert.ok(i >= 0, 'não achei a rota resumo-ofs');
  const j = SERVER.indexOf('app.post(', i);
  const rota = SERVER.slice(i, j > i ? j : i + 6000);
  assert.ok(/_ofClassificaUrgencia\(of, hojeStr\)/.test(rota), 'a rota não usa _ofClassificaUrgencia');
  assert.ok(!/Math\.round\(\(ent0 - hoje0\) \/ 86400000\)/.test(rota), 'a rota ainda usa a diferença de dias antiga');
  assert.ok(!/function entregaOf\(/.test(rota), 'função entregaOf deveria ter saído da rota');
});
