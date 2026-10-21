// [HOTFIX-EGRESS] total "todas as OFs" do Dashboard: cache 30 min, uma leitura por vez, sem cache em erro.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
// normaliza CRLF -> LF: o checkout Windows (core.autocrlf=true) grava CRLF e quebraria o
// indexOf de '\n  }\n' usado para extrair a funcao (falso negativo, nao erro de produto).
const src = fs.readFileSync(path.join(__dirname, '..', 'patch.js'), 'utf8').replace(/\r\n/g, '\n');
const ini = src.indexOf('async function __dashCalcularTotalTodasOfs()');
const fim = src.indexOf('\n  }\n', ini) + 4;
const fnSrc = src.slice(ini, fim);

function montar(respostas) {
  const store = {};
  const ctx = { chamadas: 0 };
  const window = {
    _apiAuthFetch: async () => {
      ctx.chamadas++;
      const r = respostas.shift();
      if (r === 502) return { ok: false, json: async () => { throw new SyntaxError('upstream error'); } };
      return { ok: true, json: async () => r };
    },
  };
  const sessionStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); } };
  const fn = new Function('window', 'sessionStorage', 'console', fnSrc + '; return __dashCalcularTotalTodasOfs;')(window, sessionStorage, { error() {} });
  return { fn, ctx, window, store };
}

test('soma, guarda no cache e não relê dentro de 30 min', async () => {
  const m = montar([{ ok: true, data: [{ valor_total: 10 }, { valor_total: 5 }], hasMore: false }]);
  assert.strictEqual(await m.fn(), 15);
  assert.strictEqual(await m.fn(), 15);
  assert.strictEqual(m.ctx.chamadas, 1);
  assert.ok(m.store.dash_total_todas_ofs);
});

test('chamadas simultâneas fazem uma leitura só', async () => {
  const m = montar([{ ok: true, data: [{ valor_total: 7 }], hasMore: false }]);
  const [a, b] = await Promise.all([m.fn(), m.fn()]);
  assert.strictEqual(a, 7); assert.strictEqual(b, 7);
  assert.strictEqual(m.ctx.chamadas, 1);
});

test('resposta 502 não quebra e não vira cache', async () => {
  const m = montar([502, { ok: true, data: [{ valor_total: 3 }], hasMore: false }]);
  assert.strictEqual(await m.fn(), 0);
  assert.strictEqual(m.store.dash_total_todas_ofs, undefined);
  assert.strictEqual(await m.fn(), 3);
});
