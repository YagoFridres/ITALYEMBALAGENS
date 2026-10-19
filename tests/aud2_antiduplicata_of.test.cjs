'use strict';
// AUD-2 · anti-duplicata de OF (server.js · POST /api/ofs)
//
// Dois níveis:
//  1) estático: confere na fonte do server.js que `merged` subiu para fora do bloco,
//     que a regex virou \s+ e que o sinalizador OF_ANTIDUPLICATA_ATIVA (padrão OFF)
//     protege o trecho.
//  2) funcional (sandbox vm): executa o REGIÃO REAL extraída do server.js contra um
//     supabase simulado, com dados fictícios, provando o comportamento com o
//     sinalizador ligado/desligado.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SERVER_SRC = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

const REGION_INI = '// #region anti-duplicata 2min cliente+produto+qtd';
const REGION_FIM = '// #endregion';

function regiaoAntiDuplicata() {
  const i = SERVER_SRC.indexOf(REGION_INI);
  assert.ok(i >= 0, 'não achei a região anti-duplicata em server.js');
  const j = SERVER_SRC.indexOf(REGION_FIM, i);
  assert.ok(j > i, 'não achei o fim da região anti-duplicata');
  return SERVER_SRC.slice(i, j);
}

const CLI = '11111111-1111-4111-8111-111111111111';
const EMPRESA = '22222222-2222-4222-8222-222222222222';

function makeSupabase(rows) {
  const calls = { from: 0, eq: [], gte: [], or: [], limit: [], select: [] };
  const b = {
    from(t) { calls.from++; calls._tabela = t; return b; },
    select(c) { calls.select.push(c); return b; },
    eq(c, v) { calls.eq.push([c, v]); return b; },
    gte(c, v) { calls.gte.push([c, v]); return b; },
    or(c) { calls.or.push(c); return b; },
    limit(n) { calls.limit.push(n); return b; },
    then(resolve, reject) { Promise.resolve({ data: rows, error: null }).then(resolve, reject); },
  };
  return { b, calls };
}

function makeRes() {
  const r = {
    _status: null, _json: null,
    status(c) { r._status = c; return r; },
    json(o) { r._json = o; return r; },
  };
  return r;
}

// Executa a região REAL do server.js dentro de um sandbox.
async function executarRegiao(opcoes) {
  const {
    flagLigada,
    body = {},
    merged = {},
    filtered = {},
    rows = [],
  } = opcoes || {};

  const { b, calls } = makeSupabase(rows);
  const res = makeRes();
  const warns = [];

  const sandbox = {
    supabase: b,
    res,
    req: { params: {}, _rid: 'test-aud2' },
    body,
    merged,
    filtered,
    empresaUuid: EMPRESA,
    OF_ANTIDUPLICATA_ATIVA: !!flagLigada,
    Date,
    Math,
    JSON,
    Number,
    String,
    Array,
    Object,
    Promise,
    console: {
      log() {}, debug() {},
      warn(...a) { warns.push(a.map(String).join(' ')); },
      error(...a) { warns.push(a.map(String).join(' ')); },
    },
  };

  const src = '(async () => {\n' + regiaoAntiDuplicata() + '\n})();';
  const script = new vm.Script(src, { filename: 'aud2-region.js' });
  vm.createContext(sandbox);
  await script.runInContext(sandbox);

  return { res, calls, warns };
}

// ───────────────────────── estático ─────────────────────────

test('static: sinalizador OF_ANTIDUPLICATA_ATIVA existe e é OFF por padrão', () => {
  assert.ok(
    SERVER_SRC.includes("const OF_ANTIDUPLICATA_ATIVA = String(process.env.OF_ANTIDUPLICATA_ATIVA || '').trim().toLowerCase() === 'true';"),
    'faltou declarar OF_ANTIDUPLICATA_ATIVA com padrão desligado'
  );
});

test('static: `merged` é declarado ANTES do bloco anti-duplicata (fora do bloco de validação)', () => {
  const iMergedLet = SERVER_SRC.indexOf('let merged = null;');
  const iMergedAtrib = SERVER_SRC.indexOf('merged = { ...(body || {}), ...(filtered || {}) };');
  const iRegiao = SERVER_SRC.indexOf(REGION_INI);
  assert.ok(iMergedLet >= 0, 'faltou `let merged = null;` no escopo da rota');
  assert.ok(iMergedAtrib >= 0, 'faltou a atribuição inicial de merged');
  assert.ok(iMergedLet < iRegiao, 'merged precisa estar declarado antes da região anti-duplicata');
  assert.ok(iMergedLet < iMergedAtrib, 'a declaração de merged deve vir antes da atribuição');
  assert.ok(!SERVER_SRC.includes('let merged = { ...(body'), 'merged não pode continuar com `let` dentro do bloco interno');
});

test('static: regex de normalização usa \\s+ (não mais /s+/)', () => {
  const reg = regiaoAntiDuplicata();
  assert.ok(reg.includes(".replace(/\\s+/g,' ')"), 'a região deve usar \\s+ na normalização');
  assert.ok(!reg.includes('.replace(/s+/g'), 'a região não pode conter a regex antiga /s+/');
});

test('static: a região é protegida por OF_ANTIDUPLICATA_ATIVA', () => {
  const reg = regiaoAntiDuplicata();
  assert.ok(reg.includes('if (OF_ANTIDUPLICATA_ATIVA && !confirmarDup && !req.params.id)'),
    'a consulta de duplicata deve ser condicionada ao sinalizador');
});

// ───────────────────────── funcional (sandbox) ─────────────────────────

test('flag OFF: não consulta duplicata, não devolve 409 e não registra "merged is not defined"', async () => {
  const { res, calls, warns } = await executarRegiao({
    flagLigada: false,
    merged: { cli_id: CLI, produto: 'Caixa  Grande', qtd: 10 },
    filtered: { empresa_id: EMPRESA, cli_id: CLI, descricao: 'Caixa Grande', qtd: 10 },
    rows: [{ id: 'x', numero: '5000', created_at: '2026-10-19T16:00:00Z', produto: 'Caixa Grande', qtd: 10 }],
  });
  assert.equal(calls.from, 0, 'com a flag OFF não pode haver consulta ao supabase');
  assert.equal(res._status, null, 'com a flag OFF não pode haver 409');
  assert.equal(warns.filter((w) => /merged is not defined/.test(w)).length, 0,
    'não pode mais registrar "merged is not defined"');
});

test('flag ON + duplicata (cliente+produto+qtd em 2min) → 409 com ofs_duplicadas', async () => {
  const { res, calls } = await executarRegiao({
    flagLigada: true,
    merged: { cli_id: CLI, produto: 'caixa   grande', qtd: 10 },
    filtered: { empresa_id: EMPRESA, cli_id: CLI, descricao: 'caixa grande', qtd: 10 },
    rows: [{ id: 'a1', numero: '4999', created_at: '2026-10-19T16:00:00Z', clinome: 'Cliente X', produto: 'Caixa Grande', qtd: 10 }],
  });
  assert.equal(calls.from, 1, 'deve consultar o supabase uma vez');
  assert.equal(res._status, 409, 'deve devolver 409');
  assert.equal(res._json.duplicata, true);
  assert.equal(Array.isArray(res._json.ofs_duplicadas), true);
  assert.equal(res._json.ofs_duplicadas.length, 1);
  assert.equal(res._json.ofs_duplicadas[0].numero, '4999');
});

test('flag ON + confirmarDuplicata:true → ignora a checagem e segue (sem 409, sem consulta)', async () => {
  const { res, calls } = await executarRegiao({
    flagLigada: true,
    body: { confirmarDuplicata: true },
    merged: { cli_id: CLI, produto: 'Caixa Grande', qtd: 10 },
    filtered: { empresa_id: EMPRESA, cli_id: CLI, descricao: 'Caixa Grande', qtd: 10 },
    rows: [{ id: 'a1', numero: '4999', created_at: '2026-10-19T16:00:00Z', produto: 'Caixa Grande', qtd: 10 }],
  });
  assert.equal(res._status, null, 'não pode haver 409 com confirmarDuplicata');
  assert.equal(calls.from, 0, 'não deve consultar quando o usuário já confirmou');
});

test('flag ON + produto diferente OU qtd diferente → segue sem 409', async () => {
  const a = await executarRegiao({
    flagLigada: true,
    merged: { cli_id: CLI, produto: 'Caixa Grande', qtd: 10 },
    filtered: { empresa_id: EMPRESA, cli_id: CLI, descricao: 'Caixa Grande', qtd: 10 },
    rows: [{ id: 'a1', numero: '4999', created_at: '2026-10-19T16:00:00Z', produto: 'Caixa Pequena', qtd: 10 }],
  });
  assert.equal(a.res._status, null, 'produto diferente não é duplicata');

  const b = await executarRegiao({
    flagLigada: true,
    merged: { cli_id: CLI, produto: 'Caixa Grande', qtd: 25 },
    filtered: { empresa_id: EMPRESA, cli_id: CLI, descricao: 'Caixa Grande', qtd: 25 },
    rows: [{ id: 'a1', numero: '4999', created_at: '2026-10-19T16:00:00Z', produto: 'Caixa Grande', qtd: 10 }],
  });
  assert.equal(b.res._status, null, 'qtd diferente não é duplicata');
});

test('flag ON: normalização \\s+ casa produto com espaços diferentes (bug do /s+/ não casaria)', async () => {
  // Prova do bug: '/'s+'/' troca a LETRA s; '/\\s+/' troca espaços.
  const antigo = (s) => String(s).trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/s+/g, ' ').toLowerCase();
  const novo = (s) => String(s).trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').toLowerCase();
  assert.notEqual(antigo('Bolsa   Kraft'), antigo('Bolsa Kraft'), 'a regex antiga deveria falhar em normalizar espaços');
  assert.equal(novo('Bolsa   Kraft'), novo('Bolsa Kraft'), 'a regex nova normaliza espaços corretamente');

  const { res } = await executarRegiao({
    flagLigada: true,
    merged: { cli_id: CLI, produto: 'Bolsa   Kraft', qtd: 7 },
    filtered: { empresa_id: EMPRESA, cli_id: CLI, descricao: 'Bolsa Kraft', qtd: 7 },
    rows: [{ id: 'b1', numero: '4900', created_at: '2026-10-19T16:00:00Z', produto: 'Bolsa Kraft', qtd: 7 }],
  });
  assert.equal(res._status, 409, 'com \\s+ a duplicata por espaços deve ser detectada');
});
