// [HOTFIX-EGRESS] listas de OFs sem a coluna imgs; auditoria sem base64.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

function extrair(nome) {
  const i = src.indexOf('function ' + nome + '(');
  assert.ok(i >= 0, nome + ' não encontrado');
  let depth = 0, j = src.indexOf('{', i);
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') depth++;
    else if (src[k] === '}') { depth--; if (depth === 0) return src.slice(i, k + 1); }
  }
  throw new Error('fim não encontrado');
}

test('OFS_SELECT_SLIM não inclui imgs', () => {
  const ini = src.indexOf('const OFS_SELECT_SLIM = [');
  const fim = src.indexOf('].join', ini);
  const bloco = src.slice(ini, fim);
  assert.ok(!/'imgs'/.test(bloco), 'imgs ainda está no select da lista');
  assert.ok(/'imagem_url'/.test(bloco), 'imagem_url deve continuar');
});

test('lista não usa mais select("*") em /api/ofs', () => {
  assert.ok(!src.includes("useSlimSelect ? OFS_SELECT_SLIM : '*'"));
  assert.ok(src.includes('useSlimSelect ? OFS_SELECT_SLIM : OFS_SELECT_FULL_SEM_IMGS'));
});

test('fallback de colunas não contém imgs', () => {
  const m = src.match(/const _OFS_COLUNAS_SEM_IMGS_FALLBACK = '([^']+)'/);
  assert.ok(m);
  const cols = m[1].split(',');
  assert.ok(!cols.includes('imgs'));
  assert.ok(cols.includes('imagem_url') && cols.includes('id') && cols.length > 50);
});

test('_auditSemImagens troca base64 por marcador e mantém o resto', () => {
  const fn = new Function(extrair('_auditSemImagens') + '; return _auditSemImagens;')();
  const b64 = 'data:image/png;base64,' + 'A'.repeat(5000);
  const r = fn({ id: 1, obs: 'x', imgs: JSON.stringify([b64]), imagem_url: 'https://a/b.png' });
  assert.match(r.imgs, /imagem omitida/);
  assert.strictEqual(r.imagem_url, 'https://a/b.png');
  assert.strictEqual(r.obs, 'x');
  assert.strictEqual(fn(null), null);
  assert.deepStrictEqual(fn([1, 2]), [1, 2]);
});
