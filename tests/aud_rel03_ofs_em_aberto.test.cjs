'use strict';
// REL-03 · "OFs em Aberto" mostrava 6 em vez de 397.
// Causa: a rota /api/relatorios/ofs-em-aberto usava `.limit(10000)` (o PostgREST
// corta em 1000) e filtrava "Em aberto" em memória sobre as 1000 mais antigas;
// `emp_id=all` caía na empresa do usuário e o filtro excluía empresa_id nulo.
//
// Roda as funções REAIS extraídas de server.js num sandbox vm (sem banco) e
// confere a forma da consulta (filtro no banco + paginação F-4 + all/todas).
//
// Rodar: node --test tests/aud_rel03_ofs_em_aberto.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8').replace(/\r\n/g, '\n');
const empresa = require(path.join(ROOT, 'lib', 'empresa.js'));

const ITALY = 'df5f7672-0a6b-402d-ae65-296554236c31';

function extrairFunc(src, nome) {
  const i = src.indexOf('function ' + nome + '(');
  assert.ok(i >= 0, 'função não encontrada: ' + nome);
  const prefixo = src.slice(Math.max(0, i - 6), i) === 'async ' ? 'async ' : '';
  // Fecha a lista de parâmetros antes de procurar o '{' do corpo (params podem
  // ter valor padrão como `opts = {}`).
  let d = 0;
  let j = src.indexOf('(', i);
  for (let k = j; k < src.length; k++) {
    if (src[k] === '(') d++;
    else if (src[k] === ')') { d--; if (d === 0) { j = src.indexOf('{', k); break; } }
  }
  assert.ok(j > i, 'corpo não encontrado: ' + nome);
  d = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (d === 0) return prefixo + src.slice(i, k + 1); }
  }
  throw new Error('fim não achado: ' + nome);
}

const ctx = {
  console: { log() {}, warn() {}, error() {} },
  corrigirUuid: empresa.corrigirUuid,
  EMPRESAS_FALLBACK: empresa.EMPRESAS_FALLBACK,
};
vm.createContext(ctx);
vm.runInContext(
  ['_fetchTodasPaginas', '_empresaSiglaPorUuid', '_aplicarFiltroEmpresaOfs']
    .map((n) => extrairFunc(SRC, n)).join('\n'),
  ctx
);

// buildQuery falso: `total` linhas, pageSize por página, com contagem de chamadas.
function paginadorFalso(total, pageSize = 1000) {
  const state = { calls: 0 };
  const build = async (from, to) => {
    state.calls++;
    const n = Math.max(0, Math.min(pageSize, to - from + 1, total - from));
    const out = [];
    for (let i = 0; i < n; i++) out.push({ id: 'of-' + (from + i) });
    return out;
  };
  return { build, state };
}

test('REL-03: 397 OFs (SQL de referência) -> 1 página, sem corte', async () => {
  const { build, state } = paginadorFalso(397);
  const ofs = await ctx._fetchTodasPaginas(build, { pageSize: 1000 });
  assert.equal(ofs.length, 397);
  assert.equal(state.calls, 1);
});

test('REL-03: mais de 1000 OFs -> pagina de verdade (nada é cortado)', async () => {
  const { build, state } = paginadorFalso(2500);
  const ofs = await ctx._fetchTodasPaginas(build, { pageSize: 1000 });
  assert.equal(ofs.length, 2500);
  assert.equal(state.calls, 3);
});

test('REL-03: filtro por empresa usa F-3 (empresa_id OU emp_id com empresa_id nulo)', () => {
  const chamadas = [];
  const q = {
    eq: (c, v) => { chamadas.push(['eq', c, v]); return 'EQ'; },
    or: (s) => { chamadas.push(['or', s]); return 'OR'; },
  };
  const r = ctx._aplicarFiltroEmpresaOfs(q, { todas: false, uuid: ITALY, sigla: ctx._empresaSiglaPorUuid(ITALY) });
  assert.equal(r, 'OR');
  assert.deepStrictEqual(chamadas, [['or', 'empresa_id.eq.' + ITALY + ',and(empresa_id.is.null,emp_id.eq.ITALY)']]);
});

test('REL-03: empresa sem sigla cai no eq(empresa_id)', () => {
  const chamadas = [];
  const q = { eq: (c, v) => { chamadas.push(['eq', c, v]); return 'EQ'; }, or: () => 'OR' };
  ctx._aplicarFiltroEmpresaOfs(q, { todas: false, uuid: ITALY, sigla: '' });
  assert.deepStrictEqual(chamadas, [['eq', 'empresa_id', ITALY]]);
});

test('REL-03: guarda estática — filtro no banco, páginas F-4 e all/todas sem filtro', () => {
  const i = SRC.indexOf("app.get('/api/relatorios/ofs-em-aberto'");
  const fim = SRC.indexOf("app.get('/api/relatorios/cliente-ficha'", i);
  const bloco = SRC.slice(i, fim);
  assert.ok(bloco.includes(".eq('status', 'Em aberto')"), 'o status deve ser filtrado no banco');
  assert.ok(bloco.includes(".is('deleted_at', null)"), 'deleted_at deve ser filtrado no banco');
  assert.ok(bloco.includes('_fetchTodasPaginas('), 'deve paginar com F-4');
  assert.ok(bloco.includes('{ pageSize: 1000 }'), 'pageSize 1000');
  assert.ok(
    !/\.limit\(10000\)/.test(bloco.replace(/^\s*\/\/.*$/gm, '')),
    'não pode voltar o limit(10000) que o PostgREST corta em 1000'
  );
  assert.ok(
    bloco.includes("((filtroEmpresa || !empresaAtual) ? [] : [empresaAtual])"),
    "'all'/'todas' (e ausência de empresa) devem devolver sem filtro de empresa"
  );
  assert.ok(bloco.includes('_aplicarFiltroEmpresaOfs('), 'filtro de empresa deve usar F-3');
});
