// [MOBILE-RESPONSIVO] o bloco existe, todo o CSS fica dentro de @media (max-width: 768px) e o JS só age no celular.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'patch.js'), 'utf8');
const ini = src.indexOf('// [MOBILE-RESPONSIVO-INICIO]');
const fim = src.indexOf('// [MOBILE-RESPONSIVO-FIM]');
test('bloco presente uma vez', () => {
  assert.ok(ini > 0 && fim > ini);
  assert.strictEqual(src.split('// [MOBILE-RESPONSIVO-INICIO]').length, 2);
});
test('CSS inteiro dentro de @media (max-width: 768px)', () => {
  const bloco = src.slice(ini, fim);
  const m = bloco.match(/var CSS = ("(?:[^"\\]|\\.)*");/);
  assert.ok(m);
  const css = JSON.parse(m[1]);
  assert.ok(css.startsWith('@media (max-width: 768px) {'));
  let d = 0, fechouCedo = false;
  for (let i = 0; i < css.length; i++) { if (css[i] === '{') d++; else if (css[i] === '}') { d--; if (d === 0 && i < css.length - 1) fechouCedo = true; } }
  assert.strictEqual(d, 0); assert.ok(!fechouCedo, 'há regra fora do @media (afetaria o computador)');
});
test('JS só move a barra do topo no celular e devolve no computador', () => {
  const bloco = src.slice(ini, fim);
  assert.ok(/if \(ehCelular\(\)\)/.test(bloco));
  assert.ok(/movidos\.slice\(\)\.reverse\(\)/.test(bloco));
});
