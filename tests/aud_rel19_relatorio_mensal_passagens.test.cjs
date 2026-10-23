'use strict';
// REL-19 · Relatório mensal de máquinas sem as passagens antigas.
//
// `_agruparPassagensRelatorioMensalBackend` (usado por /api/maquinas/relatorio-mensal)
// lia SÓ a tabela física `passagens_maquina`; as passagens antigas, gravadas na
// coluna JSON `ofs.passagens_maquina`, ficavam de fora → agosto/2026 vinha 0 e
// setembro vinha menor que o Histórico de Passagens.
// Correção: mesma junção do /api/passagens/historico — a tabela física VENCE e a
// coluna JSON só entra para OFs sem nenhuma linha física no período; dedup por
// of + máquina.
//
// Roda a função REAL num sandbox vm, com os colaboradores pesados em stub.
// Rodar: node --test tests/aud_rel19_relatorio_mensal_passagens.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8').replace(/\r\n/g, '\n');

function extrairFunc(src, nome) {
  const i = src.indexOf('function ' + nome + '(');
  assert.ok(i >= 0, 'função não encontrada: ' + nome);
  const prefixo = src.slice(Math.max(0, i - 6), i) === 'async ' ? 'async ' : '';
  let j = src.indexOf('(', i);
  let d = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === '(') d++;
    else if (src[k] === ')') { d--; if (d === 0) { j = src.indexOf('{', k); break; } }
  }
  d = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (d === 0) return prefixo + src.slice(i, k + 1); }
  }
  throw new Error('fim não achado: ' + nome);
}

const ctx = { console: { log() {}, warn() {}, error() {} } };
vm.createContext(ctx);
vm.runInContext(
  [
    // Helpers REAIS de dedup/normalização (a chave "of + máquina").
    extrairFunc(SRC, '_normalizarNumeroOfRef'),
    extrairFunc(SRC, '_normalizarNumeroOfDigits'),
    extrairFunc(SRC, '_normalizarStatusPassagem'),
    extrairFunc(SRC, '_pesoStatusPassagem'),
    extrairFunc(SRC, '_timestampPassagem'),
    extrairFunc(SRC, '_passagemDedupKey'),
    extrairFunc(SRC, '_mergePassagensResumoRows'),
    extrairFunc(SRC, '_normMaqNome'),
    extrairFunc(SRC, '_canonMaqNome'),
    // Função sob teste (REAL).
    extrairFunc(SRC, '_agruparPassagensRelatorioMensalBackend'),
    // Colaboradores pesados em stub.
    'var __data = { fisica: [], json: [], calls: [] };',
    'var _buscarPassagensHistoricoCompat = function(req, opts){ __data.calls.push(["compat", opts]); return Promise.resolve({ rows: __data.fisica, count: __data.fisica.length }); };',
    'var _buscarPassagensHistoricoFromOfs = function(req, opts){ __data.calls.push(["fromofs", opts]); return Promise.resolve({ rows: __data.json, count: __data.json.length }); };',
    'var _enriquecerPassagensHistoricoComOfs = function(rows){ return Promise.resolve(rows); };',
    'var _normalizarMaquinasPassagens = function(rows){ return Promise.resolve(rows); };',
    'var _calcularAggMaquinasComDistinctOf = function(){ return Promise.resolve({ agg_por_maquina: [], total_geral_caixas_distinct_ofs: 0, total_geral_valor_distinct_ofs: 0, total_geral_ofs_distintas: 0 }); };',
    'var _agruparPassagensRelatorioMensal = function(rows){ return { n: rows.length }; };',
    'var _countPassagensComValor = function(rows){ return rows.length; };',
    'var _buildPassagensResumoTop5 = function(){ return []; };',
    'var _passagensResumoParseCores = function(){ return []; };',
    'var _passagensResumoFormatTamanho = function(){ return ""; };',
    'globalThis.__run = function(fisica, json){',
    '  __data.fisica = fisica || []; __data.json = json || []; __data.calls = [];',
    '  return _agruparPassagensRelatorioMensalBackend({ query: {}, usuario: {} }, { data_inicio: "2026-09-01", data_fim: "2026-09-30" })',
    '    .then(function(out){ return { out: out, calls: __data.calls }; });',
    '};'
  ].join('\n'),
  ctx
);

const host = (v) => JSON.parse(JSON.stringify(v));

function fisicaRow(n, over) {
  return Object.assign({
    of_numero: String(n),
    of_id: 'id-' + String(n),
    maquina: 'IMP 01',
    data_passagem: '2026-09-10',
    hora_passagem: '2026-09-10T12:00:00',
    status: 'Passou pela máquina'
  }, over || {});
}
function jsonRow(n, over) {
  return Object.assign({
    of_numero: String(n),
    of_id: 'id-' + String(n),
    maquina: 'IMP 01',
    data_passagem: '2026-09-10',
    hora_passagem: '2026-09-10T12:00:00',
    status: 'Passou pela máquina'
  }, over || {});
}

// ── a junção: a coluna JSON entra para as OFs sem linha física ─────────────
test('REL-19: conta física + JSON legado (setembro = Histórico, 755)', async () => {
  const fisica = [];
  for (let i = 1; i <= 500; i += 1) fisica.push(fisicaRow(i));
  const json = [];
  for (let i = 1001; i <= 1255; i += 1) json.push(jsonRow(i));
  const { out, calls } = await ctx.__run(fisica, json);
  assert.equal(out.totalRows, 755);
  assert.equal(out.totalRowsBruto, 500, 'total bruto = só a tabela física');
  assert.ok(calls.some((c) => c[0] === 'fromofs'), 'deve buscar também a coluna JSON (fonte legada)');
});

test('REL-19: agosto deixa de vir 0 (só JSON legado)', async () => {
  const json = [];
  for (let i = 1; i <= 40; i += 1) json.push(jsonRow(i));
  const { out } = await ctx.__run([], json);
  assert.equal(out.totalRows, 40);
  assert.ok(out.totalRows > 0, 'agosto não pode zerar');
});

// ── a tabela física VENCE (não duplica a mesma OF) ─────────────────────────
test('REL-19: OF com linha física descarta a linha JSON (física vence)', async () => {
  const { out } = await ctx.__run([fisicaRow(1234)], [jsonRow(1234)]);
  assert.equal(out.totalRows, 1);
});

test('REL-19: não duplica a mesma passagem (of + máquina + hora)', async () => {
  const { out } = await ctx.__run([], [jsonRow(7), jsonRow(7)]);
  assert.equal(out.totalRows, 1);
});

test('REL-19: OF legada (sem física) e OF física coexistem sem se repetir', async () => {
  const { out } = await ctx.__run([fisicaRow(10)], [jsonRow(10), jsonRow(11)]);
  assert.equal(out.totalRows, 2, 'a OF 10 entra uma vez (física) e a 11 entra pela JSON');
});

// ── guardas estáticas ─────────────────────────────────────────────────────
test('REL-19: fonte junta a coluna JSON com a mesma regra do histórico', () => {
  const BLOCO = extrairFunc(SRC, '_agruparPassagensRelatorioMensalBackend');
  assert.ok(/_buscarPassagensHistoricoFromOfs\(req, \{ cliente, maquina, data_inicio, data_fim \}\)/.test(BLOCO), 'deve buscar a coluna JSON (FromOfs)');
  assert.ok(/ofsComFisica/.test(BLOCO), 'deve montar o conjunto de OFs com linha física');
  assert.ok(/jsonLegado\.length/.test(BLOCO), 'deve mesclar as linhas JSON legadas');
  assert.ok(/_mergePassagensResumoRows\(dedupeMap, fisicaRows\)/.test(BLOCO), 'física entra por último (vence)');
});
