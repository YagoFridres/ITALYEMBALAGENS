// [HOTFIX-EGRESS / HOTFIX-3] total "todas as OFs" do Dashboard: vem somado do SERVIDOR
// (/api/dashboard/resumo-ofs → total_valor_todas_ofs), com cache 30 min, uma leitura por vez
// e sem cache em erro. Nao pode mais reler a lista inteira (/api/ofs?offset&limit=1000).
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

function montar(respostas, resumoInicial) {
  const store = {};
  const ctx = { chamadas: 0 };
  const window = {
    // [HOTFIX-3] o total passou a ler o resumo de OFs (JSON seguro) em vez da lista inteira
    __dashUltimoResumo: resumoInicial || null,
    _apiJsonSeguro: async (r) => { try { return await r.json(); } catch (_) { return null; } },
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

test('usa o resumo já carregado e não faz nenhuma chamada', async () => {
  const m = montar([], { ok: true, total_valor_todas_ofs: 15 });
  assert.strictEqual(await m.fn(), 15);
  assert.strictEqual(await m.fn(), 15);
  assert.strictEqual(m.ctx.chamadas, 0);
  assert.ok(m.store.dash_total_todas_ofs);
});

test('sem resumo, busca no servidor uma vez e mantém no cache', async () => {
  const m = montar([{ ok: true, total_valor_todas_ofs: 42 }], null);
  assert.strictEqual(await m.fn(), 42);
  assert.strictEqual(await m.fn(), 42);
  assert.strictEqual(m.ctx.chamadas, 1);
});

test('chamadas simultâneas fazem uma leitura só', async () => {
  const m = montar([{ ok: true, total_valor_todas_ofs: 7 }], null);
  const [a, b] = await Promise.all([m.fn(), m.fn()]);
  assert.strictEqual(a, 7); assert.strictEqual(b, 7);
  assert.strictEqual(m.ctx.chamadas, 1);
});

test('resposta 502 não quebra e não vira cache (devolve null para avisar na tela)', async () => {
  const m = montar([502, { ok: true, total_valor_todas_ofs: 3 }], null);
  assert.strictEqual(await m.fn(), null);
  assert.strictEqual(m.store.dash_total_todas_ofs, undefined);
  assert.strictEqual(await m.fn(), 3);
});

test('não relê mais a lista inteira de OFs (sem /api/ofs?offset&limit=1000)', () => {
  assert.ok(!/\/api\/ofs\?offset=/.test(fnSrc), 'nao deve mais paginar /api/ofs para somar');
  assert.ok(fnSrc.includes('/api/dashboard/resumo-ofs'), 'deve buscar o total na rota que soma no servidor');
  assert.ok(fnSrc.includes('total_valor_todas_ofs'), 'deve ler o campo somado pelo servidor');
});
