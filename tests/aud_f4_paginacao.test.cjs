'use strict';
// F-4 · _fetchTodasPaginas — busca todas as páginas (range 0-999) até a
// última página parcial, com teto de páginas e aviso quando estoura.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const server = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');

function extrair(src, nome) {
  const i = src.indexOf('function ' + nome + '(');
  assert.ok(i >= 0, 'função não encontrada: ' + nome);
  const prefixo = src.slice(Math.max(0, i - 6), i) === 'async ' ? 'async ' : '';
  // pula a lista de parâmetros (parâmetros podem ter defaults com `{}`)
  let par = 0;
  let k = src.indexOf('(', i);
  for (; k < src.length; k++) {
    if (src[k] === '(') par++;
    else if (src[k] === ')') { par--; if (par === 0) break; }
  }
  let d = 0;
  const j = src.indexOf('{', k);
  for (let m = j; m < src.length; m++) {
    if (src[m] === '{') d++;
    else if (src[m] === '}') { d--; if (d === 0) return prefixo + src.slice(i, m + 1); }
  }
  throw new Error('fim não achado: ' + nome);
}

const logs = [];
const ctx = { console: { log: (m) => logs.push(String(m)) } };
vm.createContext(ctx);
vm.runInContext(extrair(server, '_fetchTodasPaginas'), ctx);

function fonte(fake, totalEsperado) {
  const ranges = [];
  return {
    ranges,
    build: (de, ate) => {
      ranges.push([de, ate]);
      const qtd = Math.max(0, Math.min(1000, totalEsperado - de));
      return fake(qtd);
    },
  };
}

// O array vem do contexto vm (outro realm); normaliza antes de comparar.
const plain = (v) => JSON.parse(JSON.stringify(v));

test('F-4: stub de 2.500 linhas -> devolve 2.500 em 3 páginas', async () => {
  const f = fonte((qtd) => Array.from({ length: qtd }, (_, i) => i), 2500);
  const out = await ctx._fetchTodasPaginas(f.build);
  assert.strictEqual(out.length, 2500);
  assert.deepStrictEqual(f.ranges, [[0, 999], [1000, 1999], [2000, 2999]]);
  assert.strictEqual(logs.length, 0, 'não deve avisar quando termina naturalmente');
});

test('F-4: página cheia (1000) continua; página parcial para', async () => {
  const f = fonte((qtd) => Array.from({ length: qtd }), 1000);
  const out = await ctx._fetchTodasPaginas(f.build);
  assert.strictEqual(out.length, 1000);
  // 1000 na primeira página + 0 na segunda (parcial) => para
  assert.deepStrictEqual(f.ranges, [[0, 999], [1000, 1999]]);
});

test('F-4: resultado vazio devolve [] com 1 chamada', async () => {
  const f = fonte(() => [], 0);
  const out = await ctx._fetchTodasPaginas(f.build);
  assert.deepStrictEqual(plain(out), []);
  assert.deepStrictEqual(f.ranges, [[0, 999]]);
});

test('F-4: respeita maxPaginas e AVISA que o resultado pode estar incompleto', async () => {
  logs.length = 0;
  const f = fonte((qtd) => Array.from({ length: qtd }), 100000);
  const out = await ctx._fetchTodasPaginas(f.build, { maxPaginas: 3 });
  assert.strictEqual(out.length, 3000);
  assert.strictEqual(f.ranges.length, 3);
  assert.ok(logs.some((m) => m.indexOf('[AUD][F-4] AVISO') >= 0), 'faltou o aviso de limite');
});

test('F-4: resposta não-array é tratada como lote vazio (para)', async () => {
  const f = fonte(() => null, 0);
  const out = await ctx._fetchTodasPaginas(f.build);
  assert.deepStrictEqual(plain(out), []);
  assert.deepStrictEqual(f.ranges, [[0, 999]]);
});
