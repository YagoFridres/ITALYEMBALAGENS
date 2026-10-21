'use strict';
// F-2 · _spRangeUtc / inicioDoDiaSP — fuso de São Paulo sem deslocamento fixo.
// O resultado NÃO pode depender do TZ do processo (rode com TZ=UTC e
// TZ=America/Sao_Paulo; os valores abaixo têm que bater nos dois).
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
  let d = 0;
  const j = src.indexOf('{', i);
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (d === 0) return prefixo + src.slice(i, k + 1); }
  }
  throw new Error('fim não achado: ' + nome);
}

const ctx = { console };
vm.createContext(ctx);
vm.runInContext(
  "const _SP_TZ = 'America/Sao_Paulo';\n" +
  ['offsetMin', 'dataLocalSP', '_spAddDiaIso', 'inicioDoDiaSP', '_spRangeUtc']
    .map((n) => extrair(server, n)).join('\n'),
  ctx
);

const casos = [
  ['inicioDoDiaSP', '2026-09-01', '2026-09-01T03:00:00.000Z', 'UTC-3'],
  ['inicioDoDiaSP', '2015-01-15', '2015-01-15T02:00:00.000Z', 'horário de verão (UTC-2)'],
  ['inicioDoDiaSP', '2018-11-04', '2018-11-04T03:00:00.000Z', 'meia-noite inexistente'],
  ['inicioDoDiaSP', '2019-02-16', '2019-02-16T02:00:00.000Z', 'último dia de verão'],
  ['inicioDoDiaSP', '2019-02-17', '2019-02-17T03:00:00.000Z', 'volta para UTC-3'],
];

// Objetos devolvidos pelo contexto vm têm outro protótipo (outro realm);
// normaliza antes de comparar com deepStrictEqual.
const plain = (v) => JSON.parse(JSON.stringify(v));

for (const [fn, entrada, esperado, obs] of casos) {
  test(`F-2: ${fn}('${entrada}') -> ${esperado} (${obs})`, () => {
    assert.strictEqual(ctx[fn](entrada), esperado);
  });
}

test("F-2: _spRangeUtc('2026-09-01','2026-09-30')", () => {
  assert.deepStrictEqual(plain(ctx._spRangeUtc('2026-09-01', '2026-09-30')), {
    gte: '2026-09-01T03:00:00.000Z',
    lt: '2026-10-01T03:00:00.000Z',
  });
});

test("F-2: _spRangeUtc('2019-02-01','2019-02-28') atravessa o fim do verão", () => {
  assert.deepStrictEqual(plain(ctx._spRangeUtc('2019-02-01', '2019-02-28')), {
    gte: '2019-02-01T02:00:00.000Z',
    lt: '2019-03-01T03:00:00.000Z',
  });
});

test("F-2: dataLocalSP('2026-10-09T01:30:00Z') -> '2026-10-08'", () => {
  assert.strictEqual(ctx.dataLocalSP('2026-10-09T01:30:00Z'), '2026-10-08');
});

test('F-2: entradas inválidas devolvem vazio/null', () => {
  assert.strictEqual(ctx.inicioDoDiaSP('x'), '');
  assert.strictEqual(ctx._spRangeUtc('', ''), null);
});
