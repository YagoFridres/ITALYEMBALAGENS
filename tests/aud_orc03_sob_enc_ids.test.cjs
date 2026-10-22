'use strict';
// ORC-03 · Sobreposição e Encurtar não podem sumir do cálculo (tela = gravado).
//
// Defeito (prompt ORC-03, crítico):
//   - tipos 202/203/209. `calcRecalcFromScope(0)` (index.html ~39749) recria o
//     `extra-fields-wrap` do bloco 0 SEM os ids #calc-sob/#calc-enc (só
//     data-calc-field). `__calcRecalcSeguro` (patch.js) lia por id e recebia 0,
//     então a TELA calculava sem sobreposição/encurtamento enquanto o valor
//     GRAVADO mantinha a sobreposição (tela R$ 10.138,53 × gravado R$ 10.315,17).
//
// Correção: wrapper de `calcRecalcFromScope` em patch.js que devolve os ids
// após o recálculo do bloco 0; `__calcRecalcSeguro` lê via calcFieldEl(0,'sob'|'enc').
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const PATCH = fs.readFileSync(path.join(ROOT, 'patch.js'), 'utf8');

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
  d = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (d === 0) return prefixo + src.slice(i, k + 1); }
  }
  throw new Error('fim não achado: ' + marcador);
}

// ── 1. Fonte: __calcRecalcSeguro lê sob/enc por calcFieldEl(0, …) ──────────
test('ORC-03 fonte: __calcRecalcSeguro lê sob/enc via calcFieldEl(0, …)', () => {
  const corpo = extrairFunc(PATCH, 'window.__calcRecalcSeguro = function ()');
  assert.ok(/calcFieldEl\(0,\s*'sob'\)/.test(corpo), 'não lê sob por calcFieldEl');
  assert.ok(/calcFieldEl\(0,\s*'enc'\)/.test(corpo), 'não lê enc por calcFieldEl');
  assert.ok(!/num\('calc-sob',\s*0\)/.test(corpo), 'ainda lê sob só por id');
});

// ── 2. Fonte: existe o wrapper que devolve os ids ─────────────────────────
test('ORC-03 fonte: wrapper devolve os ids #calc-sob/#calc-enc após o recálculo', () => {
  assert.ok(/__patchSobEncIds/.test(PATCH), 'wrapper __patchSobEncIds ausente');
  const i = PATCH.indexOf('__patchSobEncIds');
  const bloco = PATCH.slice(i, i + 1400);
  assert.ok(/calc-extr\u0061-fields|calc-extra-fields/.test(bloco), 'não mexe no wrap');
  assert.ok(/data-calc-field/.test(bloco), 'não procura por data-calc-field');
});

// ── 3. Funcional: o wrapper repõe os ids criados sem id ───────────────────
// O marcador aparece 2x (wrapper __patchCmW3 e o __patchSobEncIds): pegar o
// que vem DEPOIS de __patchSobEncIds.
const MARK_WRAP = 'window.calcRecalcFromScope = calcRecalcFromScope = function(blockIdx)';
const FN_WRAP = extrairFunc(PATCH.slice(PATCH.indexOf(MARK_WRAP, PATCH.indexOf('__patchSobEncIds'))), MARK_WRAP);
function criarWrap() {
  const wrap = {
    _children: [],
    _html: '',
    get innerHTML() { return this._html; },
    set innerHTML(v) {
      this._html = String(v);
      this._children = [];
      const re = /data-calc-field="([^"]+)"/g;
      let m;
      while ((m = re.exec(this._html))) {
        const filho = {
          __field: m[1],
          id: '',
          value: '40',
          getAttribute(a) { return a === 'data-calc-field' ? this.__field : null; }
        };
        this._children.push(filho);
      }
    },
    querySelector(sel) {
      const m = /\[data-calc-field="([^"]+)"\]/.exec(String(sel));
      if (!m) return null;
      for (const c of this._children) if (c.__field === m[1]) return c;
      return null;
    }
  };
  return wrap;
}

test('ORC-03 funcional: ids repostos após calcRecalcFromScope(0)', () => {
  const wrap = criarWrap();
  const ctx = vm.createContext({
    console,
    document: { getElementById(id) { return String(id) === 'calc-extra-fields' ? wrap : null; } },
    window: {},
    // original (index.html) recria o wrap SEM id — o bug
    origCalcFromScopeSobIds(blockIdx) {
      if (Number(blockIdx) === 0) wrap.innerHTML = '<input data-calc-field="sob" value="40">';
    }
  });
  const FN = FN_WRAP;
  vm.runInContext('calcRecalcFromScope = ' + FN + '; window.calcRecalcFromScope = calcRecalcFromScope;', ctx);
  vm.runInContext('calcRecalcFromScope(0);', ctx);
  const sob = wrap.querySelector('[data-calc-field="sob"]');
  assert.ok(sob, 'input de sob não existe');
  assert.equal(sob.id, 'calc-sob', 'id não foi reposto');
});

test('ORC-03 funcional: bloco > 0 não é tocado', () => {
  const wrap = criarWrap();
  const ctx = vm.createContext({
    console,
    document: { getElementById() { return wrap; } },
    window: {},
    origCalcFromScopeSobIds(blockIdx) {
      if (Number(blockIdx) === 1) wrap.innerHTML = '<input data-calc-field="sob" value="40">';
    }
  });
  const FN = FN_WRAP;
  vm.runInContext('calcRecalcFromScope = ' + FN + '; window.calcRecalcFromScope = calcRecalcFromScope;', ctx);
  vm.runInContext('calcRecalcFromScope(1);', ctx);
  const sob = wrap.querySelector('[data-calc-field="sob"]');
  assert.equal(sob.id, '', 'bloco 1 não deveria receber id do bloco 0');
});

// ── 4. Funcional: __calcRecalcSeguro usa o valor de sob via calcFieldEl ───
test('ORC-03 funcional: __calcRecalcSeguro pega sob=40 mesmo sem id no DOM', () => {
  const campos = {
    'calc-tipo': { value: '202', options: [{ value: '202' }], selectedIndex: 0 },
    'calc-comp': { value: '300' }, 'calc-larg': { value: '200' }, 'calc-alt': { value: '100' },
    'calc-vb': { value: '2.47' }, 'calc-vc': { value: '3.29' }, 'calc-vbc': { value: '4.46' },
    'calc-qtd': { value: '1000' }, 'calc-cf': { value: '15' }, 'calc-mg': { value: '25' },
    'calc-cv': { value: '1' }, 'calc-imp': { value: '10' }, 'calc-vkm': { value: '1.15' }, 'calc-km': { value: '50' },
    'calc-sob': null, 'calc-enc': null, 'calc-tbody': { innerHTML: '' }
  };
  let capturado = null;
  const ctx = vm.createContext({
    console,
    window: {},
    document: { getElementById(id) { return campos[String(id)] || null; } },
    // helper real de patch.js (patch.js:69233): lê por id, com padrão
    num(id, padrao) {
      const el = campos[String(id)];
      if (!el) return padrao;
      const raw = String(el.value == null ? '' : el.value).trim().replace(',', '.');
      if (raw === '') return padrao;
      const v = parseFloat(raw);
      return isFinite(v) ? v : padrao;
    },
    // calcFieldEl é o caminho robusto: acha o sob mesmo sem id no DOM
    calcFieldEl(blockIdx, key) {
      if (Number(blockIdx) === 0 && key === 'sob') return { value: '40' };
      if (Number(blockIdx) === 0 && key === 'enc') return { value: '0' };
      return null;
    },
    calcCompensacao(tipo, C, L, A, extra) {
      capturado = extra;
      return [{ largura: 1, comprimento: 1, area: 0.36365 }];
    },
    calcPrecoSeguro() { return { bruto: 1, liquida: 1, comFrete: 1, frete: 0 }; },
    fmtR(v) { return String(v); },
    fmt(v) { return String(v); },
    aplicarCustoMercCalculado() {},
    ensureCalcWaveTableRows() {},
    renderCalcWavePanels() {}
  });
  const FN = extrairFunc(PATCH, 'window.__calcRecalcSeguro = function ()');
  vm.runInContext(FN + ';', ctx);
  vm.runInContext('globalThis.__r = window.__calcRecalcSeguro();', ctx);
  assert.ok(ctx.__r !== false, 'retornou false');
  assert.ok(capturado, 'calcCompensacao não recebeu extra');
  assert.equal(capturado.sob, 40, 'sob não chegou ao cálculo');
  assert.equal(capturado.enc, 0);
});
