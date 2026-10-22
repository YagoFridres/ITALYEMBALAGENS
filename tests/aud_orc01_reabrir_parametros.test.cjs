'use strict';
// ORC-01 · Editar um orçamento reabre com os valores SALVOS (não com os padrões).
//
// Defeito (prompt ORC-01, crítico):
//   - `window.abrirCalculadoraComOrc` lia o orçamento da LISTA (GET /api/orcamentos),
//     que NÃO traz `parametros` → tipo voltava 201, sobreposição sumia e os
//     percentuais/valores de onda voltavam ao padrão. Salvar gravava os padrões
//     por cima (Onda C: salvo R$ 10.315,17 → reaberto R$ 10.386,69).
//   - `Array.isArray(window.orcParseItensRow)` era sempre false (orcParseItensRow é
//     FUNÇÃO), então caía no `orc.itens` cru.
//   - `calc-tipo` era definido sem chamar `calcTipoChange()`, então os campos
//     `#calc-sob`/`#calc-enc` não existiam e a sobreposição/encurtar era perdida.
//
// Correção: buscar GET /api/orcamentos/:id; preencher a partir de `parametros`
// (e `parametros.itens[0]`); definir `calc-tipo` + `calcTipoChange()` ANTES de
// sob/enc; trocar Array.isArray por typeof === 'function'.
//
// Roda a FUNÇÃO REAL extraída do patch.js num contexto `vm` (sem navegador,
// sem servidor, sem tocar no banco).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const PATCH = fs.readFileSync(path.join(ROOT, 'patch.js'), 'utf8');

// ── extração por balanceamento (parênteses do header, depois chaves) ───────
function extrairFunc(src, marcador) {
  const i = src.indexOf(marcador);
  assert.ok(i >= 0, 'não achei: ' + marcador);
  const prefixo = src.slice(Math.max(0, i - 6), i) === 'async ' ? 'async ' : '';
  let j = src.indexOf('(', i);
  let d = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === '(') d++;
    else if (src[k] === ')') { d--; if (d === 0) { j = src.indexOf('{', k); break; } }
  }
  assert.ok(j >= 0, 'não achei corpo: ' + marcador);
  d = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (d === 0) return prefixo + src.slice(i, k + 1); }
  }
  throw new Error('fim não achado: ' + marcador);
}

const MARK = 'window.abrirCalculadoraComOrc = async function(id)';
const FN = extrairFunc(PATCH, MARK);

// ── 1. Fonte: as três correções do ORC-01 estão no código ──────────────────
test('ORC-01 fonte: usa typeof window.orcParseItensRow === "function"', () => {
  assert.ok(/typeof window\.orcParseItensRow === 'function'/.test(FN), 'falta o typeof');
  assert.ok(!/Array\.isArray\(window\.orcParseItensRow\)/.test(FN), 'ainda usa Array.isArray');
});

test('ORC-01 fonte: busca a linha completa em GET /api/orcamentos/:id', () => {
  assert.ok(/\/api\/orcamentos\//.test(FN), 'não busca por id');
  assert.ok(/encodeURIComponent\(sid\)/.test(FN), 'não codifica o id');
});

test('ORC-01 fonte: calcTipoChange() é chamado ANTES de preencher sob/enc', () => {
  const iTipo = FN.indexOf('calcTipoChange');
  const iSob = FN.indexOf("preencherCampoParam(['calc-sob']");
  const iEnc = FN.indexOf("preencherCampoParam(['calc-enc']");
  assert.ok(iTipo >= 0, 'não chama calcTipoChange');
  assert.ok(iSob >= 0 && iEnc >= 0, 'não preenche sob/enc');
  assert.ok(iTipo < iSob && iTipo < iEnc, 'calcTipoChange depois de sob/enc');
});

test('ORC-01 fonte: grava o id atual para o Salvar fazer PUT no mesmo orçamento', () => {
  assert.ok(/_orcIdAtual = sid/.test(FN), 'não define _orcIdAtual');
});

// ── 2. Funcional: rodar a função real com DOM stub ─────────────────────────
function criarEl(id) {
  const el = {
    id: id || '',
    value: '',
    checked: false,
    readOnly: false,
    textContent: '',
    dataset: {},
    style: { setProperty() {}, opacity: '', cursor: '' },
    classList: { add() {}, remove() {}, contains() { return false; } },
    options: id === 'calc-tipo'
      ? [{ value: '200' }, { value: '201' }, { value: '202' }, { value: '203' }, { value: '209' }]
      : [],
    _children: [],
    getAttribute(a) { return this['_' + a] != null ? String(this['_' + a]) : null; },
    setAttribute(a, v) { this['_' + a] = v; },
    querySelector(sel) {
      const m = /\[data-calc-field="([^"]+)"\]/.exec(String(sel));
      if (!m) return null;
      for (const c of this._children) {
        if (c.__field === m[1]) return c;
      }
      return null;
    },
    querySelectorAll() { return []; },
    appendChild(c) { this._children.push(c); return c; },
    focus() {},
    closest() { return null; }
  };
  return el;
}

function montarVm(fullRow) {
  const byId = new Map();
  const chamadas = [];
  const sobValorNoTipoChange = [];
  const timers = [];

  const document = {
    getElementById(id) {
      const k = String(id);
      if (!byId.has(k)) byId.set(k, criarEl(k));
      return byId.get(k);
    },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    createElement() { return criarEl(''); }
  };

  const api = async (url) => ({
    ok: true,
    json: async () => ({ ok: true, data: fullRow })
  });

  const sandbox = { console, document, toast() {}, setTimeout(fn) { timers.push(fn); return 0; } };
  sandbox.window = {
    ORCAMENTOS: [{ id: 'id1', numero_orcamento: '999', cliente_id: 'c1', cliente_nome: 'ACME' }],
    _apiAuthFetch: api,
    orcParseItensRow(o) { return Array.isArray(o && o.parametros && o.parametros.itens) ? o.parametros.itens : []; },
    orcLoadItemIntoCalc() { chamadas.push('orcLoadItemIntoCalc'); },
    abrirCalculadora() { chamadas.push('abrirCalculadora'); },
    syncVb() {},
    calcRecalc() {},
    calcTipoChange() {
      chamadas.push('calcTipoChange');
      const ef = document.getElementById('calc-extra-fields');
      ef.innerHTML = '';
      const tipo = String(document.getElementById('calc-tipo').value || '');
      const mk = (field) => {
        const inp = criarEl('');
        inp.__field = field;
        inp.value = '0';
        ef.appendChild(inp);
        byId.set('calc-' + field, inp);
        return inp;
      };
      if (tipo === '202' || tipo === '203') mk('sob');
      else if (tipo === '209') mk('enc');
      sobValorNoTipoChange.push(String((document.getElementById('calc-sob') || {}).value || ''));
    }
  };

  const ctx = vm.createContext(sandbox);
  vm.runInContext(FN + ';', ctx);
  return { ctx, byId, chamadas, sobValorNoTipoChange, timers, document };
}

const FULL_202 = {
  id: 'id1',
  numero_orcamento: '999',
  cliente_id: 'c1',
  cliente_nome: 'ACME',
  nome_orcamento: 'Caixa Pizza',
  tipo: '202',
  resultados: [{ onda: 'C' }],
  parametros: { tipo: '202', sob: 40, cm: '49', cf: '15', mg: '25', cvend: '1', imp: '10', vkm: '1.15', km: '50', vb: '2.47', vc: '3.29', vbc: '4.46' }
};

test('ORC-01 funcional: reabre tipo 202 e sobreposição 40 (não os padrões)', async () => {
  const env = montarVm(FULL_202);
  await env.ctx.window.abrirCalculadoraComOrc('id1');
  env.timers.forEach((fn) => fn());
  assert.equal(env.document.getElementById('calc-tipo').value, '202', 'tipo não restaurado');
  assert.equal(env.document.getElementById('calc-sob').value, '40', 'sobreposição não restaurada');
  assert.equal(env.document.getElementById('calc-nome-orcamento').value, 'Caixa Pizza', 'nome não restaurado');
});

test('ORC-01 funcional: percentuais e frete voltam do parametros', async () => {
  const env = montarVm(FULL_202);
  await env.ctx.window.abrirCalculadoraComOrc('id1');
  env.timers.forEach((fn) => fn());
  const g = (id) => env.document.getElementById(id).value;
  assert.equal(g('calc-cf'), '15');
  assert.equal(g('calc-mg'), '25');
  assert.equal(g('calc-imp'), '10');
  assert.equal(g('calc-vkm'), '1.15');
  assert.equal(g('calc-km'), '50');
  assert.equal(g('calc-vbc'), '4.46');
});

test('ORC-01 funcional: calcTipoChange() roda antes de sob ser preenchido', async () => {
  const env = montarVm(FULL_202);
  await env.ctx.window.abrirCalculadoraComOrc('id1');
  env.timers.forEach((fn) => fn());
  assert.ok(env.chamadas.includes('calcTipoChange'), 'calcTipoChange não foi chamado');
  // no instante do calcTipoChange o sob ainda NÃO tinha o valor salvo
  assert.ok(env.sobValorNoTipoChange.every((v) => v !== '40'), 'sob foi preenchido antes do calcTipoChange');
});

test('ORC-01 funcional: define _orcIdAtual (escopo + window) para o Salvar fazer PUT', async () => {
  const env = montarVm(FULL_202);
  await env.ctx.window.abrirCalculadoraComOrc('id1');
  assert.equal(env.ctx._orcIdAtual, 'id1');
  assert.equal(env.ctx.window._orcIdAtual, 'id1');
});

test('ORC-01 funcional: ondas salvas (resultados) refletem no print', async () => {
  const env = montarVm(FULL_202);
  await env.ctx.window.abrirCalculadoraComOrc('id1');
  env.timers.forEach((fn) => fn());
  assert.equal(env.document.getElementById('calc-print-c').checked, true, 'onda C não marcada');
  assert.equal(env.document.getElementById('calc-print-b').checked, false, 'onda B marcada indevidamente');
});

test('ORC-01 funcional: cai no orc.itens cru quando orcParseItensRow não é função', async () => {
  const env = montarVm(FULL_202);
  delete env.ctx.window.orcParseItensRow;
  await env.ctx.window.abrirCalculadoraComOrc('id1');
  env.timers.forEach((fn) => fn());
  // não deve lançar e deve manter o tipo salvo
  assert.equal(env.document.getElementById('calc-tipo').value, '202');
});
