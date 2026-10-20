// Compra de Papelão: cálculo do item e vincos (servidor + front), sem banco e sem rede.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const server = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');

function extrair(src, nome) {
  const i = src.indexOf('function ' + nome + '(');
  assert.ok(i >= 0, 'função não encontrada: ' + nome);
  let d = 0, j = src.indexOf('{', i);
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (d === 0) return src.slice(i, k + 1); }
  }
  throw new Error('fim não achado: ' + nome);
}

const ctxServer = {};
vm.createContext(ctxServer);
vm.runInContext(['_comprasChapasStr', '_comprasChapasDateOrNull', '_comprasChapasNum', '_comprasChapasNormalizarVincos', '_comprasChapasBuildItemPayload']
  .map((n) => extrair(server, n)).join('\n'), ctxServer);

test('servidor: total = área × valor m²; p/mil = total ÷ qtd × 1000 (front sem marcar manual)', () => {
  const it = ctxServer._comprasChapasBuildItemPayload({ largura: 1000, comprimento: 800, quantidade: 1000, valor_m2: 3, area_m2: 800, valor_total: 2400000, area_manual: false, total_manual: false, vincos: '90/180/90' }, 'c1', 1);
  assert.strictEqual(it.area_m2, 800);
  assert.strictEqual(it.valor_total, 2400);
  assert.strictEqual(it.vl_p_mil, 2400);
});

test('servidor: vincos posicionais, repetidos e mais de 4 são mantidos', () => {
  const it = ctxServer._comprasChapasBuildItemPayload({ largura: 800, comprimento: 600, quantidade: 10, valor_m2: 1, vinco1: '6', vinco2: '6', vinco3: '6', vinco4: '6', vincos_extra: ['6', '6', '6', '6'], vincos: '6/6/6/6/6/6/6/6' }, 'c1', 1);
  assert.strictEqual(it.vincos, '6/6/6/6/6/6/6/6');
  const it2 = ctxServer._comprasChapasBuildItemPayload({ largura: 800, comprimento: 600, quantidade: 10, valor_m2: 1, vincos: '90/180/90' }, 'c1', 1);
  assert.strictEqual(it2.vincos, '90/180/90');
});

test('servidor: valor digitado à mão (marcado como manual) é respeitado', () => {
  const it = ctxServer._comprasChapasBuildItemPayload({ largura: 1000, comprimento: 1000, quantidade: 100, valor_m2: 2, valor_total: 150, total_manual: true, area_manual: false }, 'c1', 1);
  assert.strictEqual(it.area_m2, 100);
  assert.strictEqual(it.valor_total, 150);
  assert.strictEqual(it.vl_p_mil, 1500);
});

// ---- front (patch.js): funções globais da Compra de Papelão ----
const patch = fs.readFileSync(path.join(ROOT, 'patch.js'), 'utf8');
function trechoGlobal(inicio, fim) {
  const i = patch.indexOf(inicio); const j = patch.indexOf(fim, i);
  assert.ok(i >= 0 && j > i, 'trecho não encontrado: ' + inicio);
  return patch.slice(i, j);
}
const win = {};
const ctxFront = { window: win };
vm.createContext(ctxFront);
vm.runInContext(
  "window._compraPapelaoNum = function(v){ var n = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(n) ? n : 0; };\n" +
  trechoGlobal('window._compraPapelaoDeriveItem = function', 'window._compraPapelaoBlankItem = function') +
  trechoGlobal('window._compraVincosArrayFull = function', 'window._compraVincosPosicional = function'),
  ctxFront);

test('front: valor total e p/mil sem multiplicar a quantidade duas vezes', () => {
  const d = win._compraPapelaoResolveItemMetrics({ largura: '1000', comprimento: '800', quantidade: '1000', valor_m2: '3' });
  assert.strictEqual(Math.round(d.area_m2 * 1e4) / 1e4, 800);
  assert.strictEqual(Math.round(d.valor_total * 100) / 100, 2400);
  assert.strictEqual(Math.round(d.vl_p_mil * 100) / 100, 2400);
  const d2 = win._compraPapelaoResolveItemMetrics({ largura: '88', comprimento: '88', quantidade: '88', valor_m2: '8' });
  assert.strictEqual(Math.round(d2.valor_total * 100) / 100, 5.45);
  assert.strictEqual(Math.round(d2.vl_p_mil * 100) / 100, 61.95);
});

test('front: vincos posicionais sem deduplicar e sem juntar fontes repetidas', () => {
  assert.deepStrictEqual(Array.from(win._compraVincosArrayFull({ vincos: '90/180/90' })), ['90', '180', '90']);
  assert.deepStrictEqual(Array.from(win._compraVincosArrayFull({ vincos: '6/6/6/6', vincos_lista: '6/6/6/6', vinco1: '6' })), ['6', '6', '6', '6']);
  assert.deepStrictEqual(Array.from(win._compraVincosArrayFull({ vinco1: '9', vinco2: '9', vinco3: '', vinco4: '9', vincos_extra: ['9'] })), ['9', '9', '9', '9']);
});
