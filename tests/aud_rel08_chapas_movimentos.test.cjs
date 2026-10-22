'use strict';
// REL-08 · Entradas e Saídas de chapas com 150 lançamentos falsos.
// Causa: com a tabela de movimentos v2 vazia, a rota
// /api/chapas_estoque_movimentos caía em `historico_acoes`, ignorava o `tipo`,
// incluía `baixa_of` e cortava em 150.
// Correto: só movimentos reais (tabelas de movimentos), filtrando `tipo` no
// banco, sem corte (F-4) e nunca inventando linhas do histórico.
//
// Roda a ROTA REAL extraída de server.js num sandbox vm, com Supabase falso.
//
// Rodar: node --test tests/aud_rel08_chapas_movimentos.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8').replace(/\r\n/g, '\n');

const MARK = "app.get('/api/chapas_estoque_movimentos'";

function extrairRota(src, marcador) {
  const i = src.indexOf(marcador);
  assert.ok(i >= 0, 'rota não encontrada: ' + marcador);
  const j = src.indexOf('(', i);
  let d = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === '(') d++;
    else if (src[k] === ')') { d--; if (d === 0) return src.slice(i, k + 1) + ';'; }
  }
  throw new Error('fim da rota não achado: ' + marcador);
}

function extrairFunc(src, nome) {
  const i = src.indexOf('async function ' + nome + '(');
  assert.ok(i >= 0, 'função não encontrada: ' + nome);
  let d = 0;
  const p = src.indexOf('(', i);
  let j = -1;
  for (let k = p; k < src.length; k++) {
    if (src[k] === '(') d++;
    else if (src[k] === ')') { d--; if (d === 0) { j = src.indexOf('{', k); break; } }
  }
  d = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (d === 0) return src.slice(i, k + 1); }
  }
  throw new Error('fim não achado: ' + nome);
}

const EXPR = extrairRota(SRC, MARK);
const FN_PAGINAS = extrairFunc(SRC, '_fetchTodasPaginas');

// Supabase falso com "tabelas": valor = array de linhas, ou Error (tabela ausente).
function fakeSupabase(tabelas, chamadas) {
  return {
    from(tabela) {
      const reg = { tabela, filtros: [], range: null, ordem: null };
      chamadas.push(reg);
      const cfg = tabelas[tabela];
      const self = {
        select() { return self; },
        order(c) { reg.ordem = c; return self; },
        range(from, to) { reg.range = [from, to]; return self; },
        eq(c, v) { reg.filtros.push(['eq', c, v]); return self; },
        gte(c, v) { reg.filtros.push(['gte', c, v]); return self; },
        lte(c, v) { reg.filtros.push(['lte', c, v]); return self; },
        then(resolve) {
          if (cfg instanceof Error) return Promise.resolve({ data: null, error: cfg }).then(resolve);
          const filtradas = (Array.isArray(cfg) ? cfg : []).filter((r) => reg.filtros.every(([op, c, v]) => {
            if (op === 'eq') return String(r[c]) === String(v);
            if (op === 'gte') return String(r[c]) >= String(v);
            if (op === 'lte') return String(r[c]) <= String(v);
            return true;
          }));
          const [from, to] = reg.range || [0, 999];
          return Promise.resolve({ data: filtradas.slice(from, to + 1), error: null }).then(resolve);
        },
      };
      return self;
    },
  };
}

async function rodar(tabelas, query = {}) {
  const chamadas = [];
  let handler = null;
  const ctx = {
    console: { log() {}, warn() {}, error() {} },
    supabase: fakeSupabase(tabelas, chamadas),
    authMiddleware() {},
    ok(res, data) { res.__ok = (res.__ok || 0) + 1; return res.json({ ok: true, data }); },
    err(res, e) { return res.status(500).json({ ok: false, error: String(e?.message || e) }); },
    app: { get(_p, _mw, fn) { handler = fn; } },
  };
  vm.createContext(ctx);
  vm.runInContext(FN_PAGINAS + ';' + EXPR, ctx);
  assert.ok(typeof handler === 'function', 'handler não capturado');
  const res = {
    code: 0, body: null,
    status(c) { this.code = c; return this; },
    json(b) { this.body = b; return this; },
  };
  await handler({ query, params: {} }, res);
  return { status: res.code, body: res.body, chamadas };
}

test('REL-08 fonte: rota não usa historico_acoes/baixa_of e não corta em 150', () => {
  const i = SRC.indexOf(MARK);
  const fim = SRC.indexOf("app.delete('/api/chapas_estoque_movimentos'", i);
  const bloco = SRC.slice(i, fim);
  assert.ok(!/\.from\('historico_acoes'\)/.test(bloco), 'não pode cair em historico_acoes');
  assert.ok(!/'baixa_of'/.test(bloco), 'não pode incluir baixa_of');
  assert.ok(!/tipo_acao/.test(bloco), 'não pode filtrar por tipo_acao do histórico');
  assert.ok(!/Math\.min\(150/.test(bloco), 'não pode cortar em 150');
  assert.ok(/_fetchTodasPaginas\(/.test(bloco), 'deve usar paginação F-4');
  assert.ok(/\.eq\('tipo',\s*tipo\)/.test(bloco), 'deve filtrar tipo no banco');
});

test('REL-08 funcional: filtra por tipo (entrada) e ignora as demais', async () => {
  const { body } = await rodar({
    chapas_estoque_movimentos_v2: [
      { id: 'm1', chapa_id: 'c1', tipo: 'entrada', created_at: '2026-09-10T10:00:00Z' },
      { id: 'm2', chapa_id: 'c1', tipo: 'saida', created_at: '2026-09-11T10:00:00Z' },
      { id: 'm3', chapa_id: 'c1', tipo: 'ajuste', created_at: '2026-09-12T10:00:00Z' },
    ],
  }, { tipo: 'entrada', data_inicio: '2026-09-01', data_fim: '2026-09-30' });
  assert.equal(body.ok, true);
  assert.equal(body.data.length, 1);
  assert.equal(body.data[0].id, 'm1');
});

test('REL-08 funcional: sem movimentos reais no período -> [] (nunca inventa)', async () => {
  const { body, chamadas } = await rodar({
    chapas_estoque_movimentos_v2: [],
    chapas_estoque_movimentos: [],
  }, { data_inicio: '2026-09-01', data_fim: '2026-09-30' });
  assert.equal(body.ok, true);
  assert.equal(body.data.length, 0);
  // tentou as duas tabelas de movimentos e não caiu em histórico
  assert.ok(chamadas.every((c) => c.tabela !== 'historico_acoes'), 'não pode consultar historico_acoes');
  assert.deepEqual(chamadas.map((c) => c.tabela), ['chapas_estoque_movimentos_v2', 'chapas_estoque_movimentos']);
});

test('REL-08 funcional: cai na tabela legada quando a v2 não tem linhas', async () => {
  const { body } = await rodar({
    chapas_estoque_movimentos_v2: [],
    chapas_estoque_movimentos: [
      { id: 'L1', chapa_id: 'c9', tipo: 'saida', created_at: '2026-09-05T10:00:00Z' },
    ],
  }, { tipo: 'saida', data_inicio: '2026-09-01', data_fim: '2026-09-30' });
  assert.equal(body.data.length, 1);
  assert.equal(body.data[0].id, 'L1');
});

test('REL-08 funcional: tabela v2 ausente -> usa a legada sem estourar', async () => {
  const { status, body, chamadas } = await rodar({
    chapas_estoque_movimentos_v2: new Error('relation "chapas_estoque_movimentos_v2" does not exist'),
    chapas_estoque_movimentos: [
      { id: 'L1', tipo: 'entrada', created_at: '2026-09-05T10:00:00Z' },
    ],
  }, { tipo: 'entrada' });
  assert.equal(status, 0);
  assert.equal(body.data.length, 1);
  assert.deepEqual(chamadas.map((c) => c.tabela), ['chapas_estoque_movimentos_v2', 'chapas_estoque_movimentos']);
});

test('REL-08 funcional: sem corte em 150 (1200 linhas -> 2 páginas)', async () => {
  const rows = [];
  for (let i = 0; i < 1200; i++) rows.push({ id: 'm' + i, tipo: 'entrada', created_at: '2026-09-10T10:00:00Z' });
  const { body, chamadas } = await rodar({ chapas_estoque_movimentos_v2: rows }, {});
  assert.equal(body.data.length, 1200, 'deve devolver todas as linhas');
  const paginas = chamadas.filter((c) => c.tabela === 'chapas_estoque_movimentos_v2');
  assert.equal(paginas.length, 2, 'duas páginas de 1000');
  assert.deepEqual(paginas[0].range, [0, 999]);
  assert.deepEqual(paginas[1].range, [1000, 1999]);
});

test('REL-08 funcional: erro real do banco (não "ausente") vira 500', async () => {
  const { status } = await rodar({
    chapas_estoque_movimentos_v2: new Error('permission denied for table'),
  }, {});
  assert.equal(status, 500);
});
