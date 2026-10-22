'use strict';
// REL-04 · Central de Custos mostrava perdas R$ 0.
// Causa: `baseCols` de `_ccustosCalcularPerdasCompetencia` pedia a coluna
// `empresa_id`, que NÃO existe em `caixas_perdidas`. O PostgREST devolvia erro,
// o laço caía no QUERY_ERROR e as perdas voltavam { valor: 0, qtd: 0 }.
// O filtro de empresa também usava `or(emp_id..., empresa_id...)`.
//
// Roda a função REAL extraída de server.js num sandbox vm com um Supabase falso
// (sem banco), validando: coluna pedida, filtro aplicado e soma das perdas.
//
// Rodar: node --test tests/aud_rel04_perdas_competencia.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8').replace(/\r\n/g, '\n');

const ITALY = 'df5f7672-0a6b-402d-ae65-296554236c31';

function extrairFunc(src, nome) {
  const i = src.indexOf('function ' + nome + '(');
  assert.ok(i >= 0, 'função não encontrada: ' + nome);
  const prefixo = src.slice(Math.max(0, i - 6), i) === 'async ' ? 'async ' : '';
  const j = src.indexOf('{', i);
  let d = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (d === 0) return prefixo + src.slice(i, k + 1); }
  }
  throw new Error('fim não achado: ' + nome);
}

function extrairConstMapa(src, nome) {
  const i = src.indexOf('const ' + nome + ' = {');
  assert.ok(i >= 0, 'mapa não encontrado: ' + nome);
  const j = src.indexOf('{', i);
  let d = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (d === 0) return src.slice(i, k + 1) + ';'; }
  }
  throw new Error('fim do mapa não achado: ' + nome);
}

// ── Supabase falso: registra select/filtros e devolve linhas fictícias ──────
function fakeSupabase(registro, rows) {
  function builder(tabela) {
    const reg = { tabela, select: null, filtros: [], limit: null, in: null };
    const self = {
      select(cols) { reg.select = cols; return self; },
      gte(c, v) { reg.filtros.push(['gte', c, v]); return self; },
      lt(c, v) { reg.filtros.push(['lt', c, v]); return self; },
      limit(n) { reg.limit = n; return self; },
      eq(c, v) { reg.filtros.push(['eq', c, v]); return self; },
      or(s) { reg.filtros.push(['or', s]); return self; },
      in(c, v) { reg.in = [c, v]; return self; },
      then(resolve, reject) {
        registro.push(reg);
        // Primeira tabela de perdas devolve as linhas fictícias; o resto, vazio.
        const data = tabela === 'caixas_perdidas' ? rows : [];
        return Promise.resolve({ data, error: null }).then(resolve, reject);
      },
    };
    return self;
  }
  return { from: (tabela) => builder(tabela) };
}

function criarCtx(supabase) {
  const ctx = { console: { log() {}, warn() {}, error() {} }, supabase };
  vm.createContext(ctx);
  vm.runInContext(
    [
      extrairConstMapa(SRC, '_CCUSTOS_EMP_IDS'),
      extrairFunc(SRC, '_ccustosResolveEmpresaId'),
      extrairFunc(SRC, '_ccustosCalcularPerdasCompetencia'),
    ].join('\n'),
    ctx
  );
  return ctx;
}

test('REL-04: o select das perdas NÃO pede a coluna inexistente empresa_id', async () => {
  const registro = [];
  const ctx = criarCtx(fakeSupabase(registro, []));
  await ctx._ccustosCalcularPerdasCompetencia('2026-09', 'ALL', null);

  assert.ok(registro.length >= 1, 'deve consultar pelo menos a primeira tabela de perdas');
  const cols = registro[0].select;
  assert.ok(cols, 'o select deve ter sido montado');
  assert.ok(!cols.includes('empresa_id'), 'baseCols não pode conter empresa_id: ' + cols);
  assert.ok(cols.includes('emp_id'), 'baseCols deve manter emp_id');
  assert.ok(cols.includes('valor_perdido') && cols.includes('qtd_perdida'), 'baseCols deve trazer valor/qtd da perda');
});

test('REL-04: filtro de empresa específica usa eq(emp_id) e nunca empresa_id', async () => {
  const registro = [];
  const ctx = criarCtx(fakeSupabase(registro, []));
  await ctx._ccustosCalcularPerdasCompetencia('2026-09', 'E1', null);

  const reg = registro[0];
  assert.ok(
    reg.filtros.some((f) => f[0] === 'eq' && f[1] === 'emp_id' && f[2] === ITALY),
    'deve filtrar por eq(emp_id, <uuid da empresa>)'
  );
  assert.ok(!JSON.stringify(reg).includes('empresa_id'), 'nenhuma referência a empresa_id na consulta');
});

test("REL-04: 'ALL'/'todas' não aplica filtro de empresa", async () => {
  const registro = [];
  const ctx = criarCtx(fakeSupabase(registro, []));
  await ctx._ccustosCalcularPerdasCompetencia('2026-09', 'ALL', null);
  const reg = registro[0];
  assert.ok(!reg.filtros.some((f) => f[0] === 'or' || f[2] === 'emp_id' || f[1] === 'emp_id'), 'sem filtro de empresa');
  assert.ok(reg.filtros.some((f) => f[1] === 'data'), 'só o intervalo de competência');
});

test("REL-04: '__sem_empresa__' filtra só por emp_id nulo/vazio", async () => {
  const registro = [];
  const ctx = criarCtx(fakeSupabase(registro, []));
  await ctx._ccustosCalcularPerdasCompetencia('2026-09', '__sem_empresa__', null);
  assert.ok(
    registro[0].filtros.some((f) => f[0] === 'or' && f[1] === 'emp_id.is.null,emp_id.eq.'),
    'deve usar or(emp_id.is.null,emp_id.eq.)'
  );
});

test('REL-04: setembro soma as perdas reais (R$ 9.962,84 / 1.120 cx)', async () => {
  const registro = [];
  const rows = [
    { of_id: 'a', qtd_perdida: 600, valor_perdido: 5000 },
    { of_id: 'b', qtd_perdida: 520, valor_perdido: 4962.84 },
  ];
  const ctx = criarCtx(fakeSupabase(registro, rows));
  const r = await ctx._ccustosCalcularPerdasCompetencia('2026-09', 'ALL', null);
  assert.strictEqual(r.valor, 9962.84);
  assert.strictEqual(r.qtd, 1120);
});

test('REL-04: sem perdas no mês -> { valor: 0, qtd: 0 } (sem erro)', async () => {
  const registro = [];
  const ctx = criarCtx(fakeSupabase(registro, []));
  const r = await ctx._ccustosCalcularPerdasCompetencia('2026-10', 'ALL', null);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(r)), { valor: 0, qtd: 0 });
});

test('REL-04: guarda estática — baseCols/empresa não voltam a citar empresa_id', () => {
  const i = SRC.indexOf('function _ccustosCalcularPerdasCompetencia');
  const fim = SRC.indexOf('async function _ccustosCalcularLancamentosCompetencia', i);
  const bloco = SRC.slice(i, fim);
  assert.ok(!bloco.includes('empresa_id,quantidade'), 'baseCols não pode voltar a pedir empresa_id');
  assert.ok(!bloco.includes('empresa_id.eq.'), 'o filtro não pode montar empresa_id.eq.');
  assert.ok(bloco.includes("q.eq('emp_id', rPerdas)"), 'o filtro de empresa deve ser eq(emp_id)');
});
