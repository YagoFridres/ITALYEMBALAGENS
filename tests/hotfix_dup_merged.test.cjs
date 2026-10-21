// [HOTFIX-DUP] anti-duplicata do POST /api/ofs não pode referenciar `merged` fora do escopo.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
test('bloco anti-duplicata declara merged antes de usar e não seleciona ofs.produto', () => {
  const ini = src.indexOf('// #region anti-duplicata 2min cliente+produto+qtd');
  const fim = src.indexOf('// #endregion', ini);
  const bloco = src.slice(ini, fim);
  const decl = bloco.indexOf('var merged = Object.assign({}, body || {}, filtered || {});');
  assert.ok(decl > 0, 'merged não declarado no bloco');
  assert.ok(decl < bloco.indexOf('merged.cli_id'), 'merged usado antes de declarado');
  const sel = bloco.match(/\.select\('([^']+)'\)/)[1].split(',');
  assert.ok(!sel.includes('produto'));
});
