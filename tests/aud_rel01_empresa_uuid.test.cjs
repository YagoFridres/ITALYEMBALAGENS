'use strict';
// REL-01 · Oestepack perdia OFs por UUID errado.
// Parte das OFs foi gravada com VARIANTES QUEBRADAS do UUID da Oestepack; os
// relatórios por empresa as descartavam (setembro: 713 OFs em vez de 749).
//
// Roda as funções REAIS de server.js num sandbox vm (sem banco) e confere que
// o UUID errado é corrigido (F-3/_empresaDaOf) e que a classificação por
// empresa cai em emp_id quando o UUID é desconhecido.
//
// Rodar: node --test tests/aud_rel01_empresa_uuid.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8').replace(/\r\n/g, '\n');
const empresa = require(path.join(ROOT, 'lib', 'empresa.js'));

const ITALY = 'df5f7672-0a6b-402d-ae65-296554236c31';
const CARTO = 'e9b734dc-c7d5-4b04-898d-1ec7affa721e';
const OESTE = 'a6e5f5d8-4743-4ebe-885e-c2f0741a667a';
// Variantes quebradas (lib/empresa.js · UUID_VARIANTES_QUEBRADAS)
const ERR_0F741 = 'a6e5f5d8-4743-4ebe-885e-c2f0f741a667';
const ERR_SEM_A = 'a6e5f5d8-4743-4ebe-885e-c2f0741a667';
const ERR_37 = 'a6e5f5d8-4743-4ebe-885e-c2f0f741a667a';
// UUID válido porém NÃO pertencente a nenhuma das três empresas (nem variante
// quebrada conhecida): é o caso em que a classificação tem de cair no emp_id.
const DESCONHECIDO = '11111111-1111-4111-8111-111111111111';

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

function extrairConst(src, nome) {
  const i = src.indexOf('const ' + nome + ' =');
  assert.ok(i >= 0, 'const não encontrada: ' + nome);
  const fim = src.indexOf('\n', i);
  return src.slice(i, fim);
}

const ctx = {
  console: { log() {}, warn() {}, error() {} },
  corrigirUuid: empresa.corrigirUuid,
  _isUuid: empresa.isUuid,
  EMPRESAS_FALLBACK: empresa.EMPRESAS_FALLBACK,
};
vm.createContext(ctx);
vm.runInContext(
  [
    extrairConst(SRC, '_JJ3_U1'),
    extrairConst(SRC, '_JJ3_U2'),
    extrairConst(SRC, '_JJ3_U3'),
    extrairFunc(SRC, '_relatoriosLegacyEmpresaUuid'),
    extrairFunc(SRC, '_empresaDaOf'),
    extrairFunc(SRC, '_relatoriosPickEmpresaId'),
    extrairFunc(SRC, '_jj3ClassificaEmpresa'),
  ].join('\n'),
  ctx
);

// ── _relatoriosPickEmpresaId (F-3) ────────────────────────────────────────
test('REL-01: UUID errado da Oestepack conta como Oestepack', () => {
  assert.strictEqual(ctx._relatoriosPickEmpresaId({ empresa_id: ERR_0F741 }), OESTE);
  assert.strictEqual(ctx._relatoriosPickEmpresaId({ empresa_id: ERR_SEM_A }), OESTE);
});

test('REL-01: variante de 37 caracteres (inválida) resolve por emp_id=E3', () => {
  assert.strictEqual(ctx._relatoriosPickEmpresaId({ empresa_id: ERR_37, emp_id: 'E3' }), OESTE);
});

test('REL-01: sem empresa_id, usa a sigla emp_id', () => {
  assert.strictEqual(ctx._relatoriosPickEmpresaId({ empresa_id: '', emp_id: 'E3' }), OESTE);
  assert.strictEqual(ctx._relatoriosPickEmpresaId({ empresa_id: '', emp_id: 'E1' }), ITALY);
  assert.strictEqual(ctx._relatoriosPickEmpresaId({ empresa_id: '', emp_id: 'E2' }), CARTO);
});

test('REL-01: UUIDs corretos passam direto', () => {
  assert.strictEqual(ctx._relatoriosPickEmpresaId({ empresa_id: ITALY }), ITALY);
  assert.strictEqual(ctx._relatoriosPickEmpresaId({ empresa_id: OESTE }), OESTE);
});

// ── _jj3ClassificaEmpresa ─────────────────────────────────────────────────
test('REL-01: classificação do UUID errado cai em U3 (Oestepack)', () => {
  assert.strictEqual(ctx._jj3ClassificaEmpresa({ empresa_id: ERR_0F741, emp_id: 'E3' }), 'U3');
  assert.strictEqual(ctx._jj3ClassificaEmpresa({ empresa_id: ERR_SEM_A, emp_id: 'E3' }), 'U3');
  assert.strictEqual(ctx._jj3ClassificaEmpresa({ empresa_id: ERR_37, emp_id: 'E3' }), 'U3');
});

test('REL-01: UUID desconhecido usa emp_id (E1/E2/E3)', () => {
  assert.strictEqual(ctx._jj3ClassificaEmpresa({ empresa_id: DESCONHECIDO, emp_id: 'E1' }), 'U1');
  assert.strictEqual(ctx._jj3ClassificaEmpresa({ empresa_id: DESCONHECIDO, emp_id: 'E2' }), 'U2');
  assert.strictEqual(ctx._jj3ClassificaEmpresa({ empresa_id: '', emp_id: 'E3' }), 'U3');
  assert.strictEqual(ctx._jj3ClassificaEmpresa({ empresa_id: '', emp_id: 'E2' }), 'U2');
});

test('REL-01: sem empresa nenhuma continua SEM', () => {
  assert.strictEqual(ctx._jj3ClassificaEmpresa({ empresa_id: '', emp_id: '' }), 'SEM');
  assert.strictEqual(ctx._jj3ClassificaEmpresa({}), 'SEM');
});

test('REL-01: UUIDs corretos continuam classificando U1/U2/U3', () => {
  assert.strictEqual(ctx._jj3ClassificaEmpresa({ empresa_id: ITALY }), 'U1');
  assert.strictEqual(ctx._jj3ClassificaEmpresa({ empresa_id: CARTO }), 'U2');
  assert.strictEqual(ctx._jj3ClassificaEmpresa({ empresa_id: OESTE }), 'U3');
});

// ── Integridade: nenhuma das 39 OFs fica sem empresa ──────────────────────
test('REL-01: OFs com variante quebrada+emp_id entram em alguma empresa (sem OUTRA)', () => {
  const amostra = [
    { empresa_id: ERR_0F741, emp_id: 'E3' },
    { empresa_id: ERR_SEM_A, emp_id: 'E3' },
    { empresa_id: ERR_37, emp_id: 'E3' },
    // Uma das 3 OFs que a migração D1 deixa para decisão: UUID quebrado da
    // Oestepack com emp_id E1. A classificação segue o UUID corrigido (U3) —
    // é justamente por isso que a D1 não as altera sozinha.
    { empresa_id: ERR_0F741, emp_id: 'E1' },
    { empresa_id: DESCONHECIDO, emp_id: 'E2' },
  ];
  const buckets = amostra.map((of) => ctx._jj3ClassificaEmpresa(of));
  assert.deepStrictEqual(buckets, ['U3', 'U3', 'U3', 'U3', 'U2']);
  assert.ok(buckets.every((b) => b === 'U1' || b === 'U2' || b === 'U3'));
});

// ── Guarda estática ───────────────────────────────────────────────────────
test('REL-01: _relatoriosPickEmpresaId delega para _empresaDaOf (F-3)', () => {
  const i = SRC.indexOf('function _relatoriosPickEmpresaId(');
  const fim = SRC.indexOf('function _relatoriosPickValorOf(', i);
  const bloco = SRC.slice(i, fim);
  assert.ok(bloco.includes('return _empresaDaOf(of)'), 'deve delegar para _empresaDaOf');
  assert.ok(!bloco.includes('_isUuid(uuid)'), 'não pode voltar a aceitar o UUID errado direto');
});

test('REL-01: migração D1_uuid_oestepack.sql existe em migrations/pendentes', () => {
  const p = path.join(ROOT, 'migrations', 'pendentes', 'D1_uuid_oestepack.sql');
  assert.ok(fs.existsSync(p), 'a migração proposta deve existir');
  const sql = fs.readFileSync(p, 'utf8');
  assert.ok(sql.includes('NÃO EXECUTAR'), 'deve avisar que não é para executar');
  assert.ok(sql.includes('ROLLBACK'), 'deve ter ROLLBACK explícito');
  assert.ok(sql.includes('a6e5f5d8-4743-4ebe-885e-c2f0741a667a'), 'deve usar o UUID correto da Oestepack');
});

// ── Integração: pipeline REAL dos 3 relatórios (set/2026) ─────────────────
// As rotas /api/relatorios/vendas-por-empresa, /comparativo-mensal e
// /evolucao-vendas chamam _relatoriosFetchOfsConcluidas(range,{companyIds})
// e _relatoriosSummarizeOfs(ofs,{companyIds}) com a LISTA FIXA das 3 empresas.
// Aqui rodamos exatamente esse caminho sobre um fixture de set/2026 e provamos:
//   (1) E1+E2+E3 = total geral;
//   (2) a Oestepack inclui as OFs gravadas com o UUID errado.
const FIXAS = [
  { id: ITALY, nome: 'Italy' },
  { id: CARTO, nome: 'Cartoeste' },
  { id: OESTE, nome: 'Oestepack' },
];
const COMPANY_IDS = FIXAS.map((e) => e.id);

// O fixture é trocado por teste; o stub devolve as linhas e respeita o
// contrato de _selectCompatRows ({ data, error, columns }).
let FETCH_ROWS = [];
ctx._selectCompatRows = async function (table, columns) {
  return { data: FETCH_ROWS.slice(), error: null, columns };
};

vm.runInContext(
  [
    'const _RELATORIOS_EMPRESAS_FIXAS = ' + JSON.stringify(FIXAS) + ';',
    extrairFunc(SRC, '_relatoriosEmpresaNome'),
    extrairFunc(SRC, '_relatoriosPickValorOf'),
    extrairFunc(SRC, '_relatoriosPickQtdOf'),
    extrairFunc(SRC, '_relatoriosPickPerdaOf'),
    extrairFunc(SRC, '_relatoriosPickTonOf'),
    extrairFunc(SRC, '_relatoriosSummarizeOfs'),
    extrairFunc(SRC, '_relatoriosIsoDateOnly'),
    extrairFunc(SRC, '_vendasOficialStatusConcluido'),
    extrairFunc(SRC, '_vendasOficialDateObj'),
    extrairFunc(SRC, '_vendasOficialDataRef'),
    extrairFunc(SRC, '_vendasOficialDentroDoPeriodo'),
    extrairFunc(SRC, '_relatoriosFetchOfsConcluidas'),
  ].join('\n'),
  ctx
);

function ofSet(empresa_id, emp_id, valor, dia) {
  return {
    id: 'of-' + String(valor) + '-' + String(empresa_id || emp_id),
    numero: 1,
    status: 'Concluída',
    deleted_at: null,
    data_conclusao: dia || '2026-09-10',
    empresa_id: empresa_id || '',
    emp_id: emp_id || '',
    valor_total: valor,
    qtd: 1
  };
}

const RANGE_SET = { inicio: '2026-09-01', fim: '2026-09-30', fim_exclusivo: '2026-10-01' };

async function rodarPipelineSet() {
  const ofs = await ctx._relatoriosFetchOfsConcluidas(RANGE_SET, { companyIds: COMPANY_IDS });
  const agg = ctx._relatoriosSummarizeOfs(ofs, { companyIds: COMPANY_IDS });
  return {
    qtd: ofs.length,
    raw: JSON.parse(JSON.stringify(agg))
  };
}

test('REL-01 (set/2026): E1+E2+E3 = total geral (nenhuma OF some)', async () => {
  FETCH_ROWS = [
    ofSet(ITALY, 'E1', 1000),            // Italy, UUID correto
    ofSet('', 'E1', 500),                // Italy, só emp_id (UUID vazio)
    ofSet(CARTO, 'E2', 2000),            // Cartoeste
    ofSet(OESTE, 'E3', 300),             // Oestepack, UUID correto
    ofSet(ERR_0F741, '', 400),           // Oestepack, UUID errado (variante 0f741)
    ofSet(ERR_SEM_A, 'E3', 400),         // Oestepack, variante sem o "a" final
    ofSet(ERR_37, 'E3', 50),             // Oestepack, variante de 35 chars + emp_id
  ];
  const { qtd, raw } = await rodarPipelineSet();

  assert.strictEqual(qtd, 7, 'as 7 OFs de set/2026 entram na consulta');
  assert.strictEqual(raw.resumo.valor_vendido, 4650, 'total geral = soma das 7 OFs');

  const porId = {};
  raw.por_empresa.forEach((r) => { porId[r.empresa_id] = r; });
  const soma = COMPANY_IDS.reduce((acc, id) => acc + Number(porId[id]?.valor_vendido || 0), 0);

  assert.strictEqual(soma, raw.resumo.valor_vendido, 'E1+E2+E3 tem de fechar o total geral');
  assert.strictEqual(Number(porId[ITALY]?.valor_vendido || 0), 1500, 'Italy = 1000 + 500');
  assert.strictEqual(Number(porId[CARTO]?.valor_vendido || 0), 2000, 'Cartoeste = 2000');
  assert.strictEqual(Number(porId[OESTE]?.valor_vendido || 0), 1150, 'Oestepack = 300 + 400 + 400 + 50');
  assert.strictEqual(Number(porId[ITALY]?.total_ofs || 0), 2);
  assert.strictEqual(Number(porId[CARTO]?.total_ofs || 0), 1);
  assert.strictEqual(Number(porId[OESTE]?.total_ofs || 0), 4);
});

test('REL-01 (set/2026): Oestepack inclui as OFs com o UUID errado', async () => {
  FETCH_ROWS = [
    ofSet(OESTE, 'E3', 300),
    ofSet(ERR_0F741, '', 400),
    ofSet(ERR_SEM_A, 'E3', 400),
    ofSet(ERR_37, 'E3', 50),
  ];
  const brutas = FETCH_ROWS.filter((r) => String(r.empresa_id) === OESTE).length;
  const { raw } = await rodarPipelineSet();
  const oeste = raw.por_empresa.find((r) => r.empresa_id === OESTE);

  assert.strictEqual(brutas, 1, 'só 1 das 4 OFs tem o UUID CORRETO gravado');
  assert.ok(oeste, 'a Oestepack aparece no relatório');
  assert.strictEqual(Number(oeste.total_ofs), 4, 'as 4 OFs contam na Oestepack (3 pelo UUID corrigido/emp_id)');
  assert.strictEqual(Number(oeste.valor_vendido), 1150, 'valor completo da Oestepack em set/2026');
});

test('REL-01 (set/2026): OFs fora do mês não entram no total', async () => {
  FETCH_ROWS = [
    ofSet(ITALY, 'E1', 1000, '2026-09-10'),
    ofSet(OESTE, 'E3', 999, '2026-08-31'),
    ofSet(CARTO, 'E2', 777, '2026-10-01'),
  ];
  const { raw } = await rodarPipelineSet();
  assert.strictEqual(raw.resumo.valor_vendido, 1000, 'só a OF de setembro conta');
  assert.strictEqual(raw.por_empresa.reduce((a, r) => a + Number(r.valor_vendido || 0), 0), 1000);
});

test('REL-01 (set/2026): as 3 rotas usam a lista FIXA das 3 empresas', () => {
  const rotas = [
    '/api/relatorios/vendas-por-empresa',
    '/api/relatorios/comparativo-mensal',
    '/api/relatorios/evolucao-vendas'
  ];
  rotas.forEach((rota) => {
    const i = SRC.indexOf("app.get('" + rota + "'");
    assert.ok(i >= 0, 'rota não encontrada: ' + rota);
    const prox = SRC.indexOf("app.get('/api/relatorios/", i + 10);
    const bloco = SRC.slice(i, prox > 0 ? prox : i + 3000);
    assert.ok(
      bloco.includes('_RELATORIOS_EMPRESAS_FIXAS.map((item) => item.id)') ||
        bloco.includes('_RELATORIOS_EMPRESAS_FIXAS.map((e) => e.id)'),
      'a rota ' + rota + ' deve continuar usando a lista fixa das 3 empresas'
    );
    assert.ok(
      !/companyIds[^\n]*=\s*\[[^\]]*\.filter\(/.test(bloco),
      'a rota ' + rota + ' não deve descartar OFs por UUID cru'
    );
  });
});
