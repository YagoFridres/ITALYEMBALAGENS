'use strict';
// REL-02 · Filtro "Empresa" da Central ignorado pelos relatórios.
// A Central manda `emp_id=E1|E2|E3` (ou `todas_empresas=1`) mas vários relatórios
// caíam na empresa do usuário (`_resolveEmpresaUuid`) ou usavam um `or(...)` que
// só aceitava UUID — ex.: com Oestepack selecionada "Vendas por Ramo" mostrava Italy
// e "Custo por OF" mostrava todas as empresas.
//
// Correção: todas as rotas passam pelo filtro único F-3 (`_empresaFiltro` +
// `_aplicarFiltroEmpresaOfs`); as tabelas de perdas filtram por `emp_id` (sigla);
// o front monta a URL por `rrApiUrl` (empresa incluída) e a impressão mostra o escopo.
//
// Roda funções/rotas REAIS extraídas do fonte num sandbox vm (sem banco).
//
// Rodar: node --test tests/aud_rel02_empresa_relatorios.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8').replace(/\r\n/g, '\n');
const PATCH = fs.readFileSync(path.join(ROOT, 'patch.js'), 'utf8').replace(/\r\n/g, '\n');
const empresa = require(path.join(ROOT, 'lib', 'empresa.js'));

const ITALY = 'df5f7672-0a6b-402d-ae65-296554236c31';
const CARTO = 'e9b734dc-c7d5-4b04-898d-1ec7affa721e';
const OESTE = 'a6e5f5d8-4743-4ebe-885e-c2f0741a667a';

// ── extratores (mesmo padrão de aud_rel09) ─────────────────────────────────
function extrairFunc(src, nome) {
  const i = src.indexOf('function ' + nome + '(');
  assert.ok(i >= 0, 'função não encontrada: ' + nome);
  const prefixo = src.slice(Math.max(0, i - 6), i) === 'async ' ? 'async ' : '';
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

function extrairRota(src, caminho) {
  const marker = "app.get('" + caminho + "'";
  const i = src.indexOf(marker);
  assert.ok(i >= 0, 'rota não encontrada: ' + caminho);
  const h = src.indexOf('async (req, res) => {', i);
  assert.ok(h > i, 'handler não encontrado: ' + caminho);
  const j = src.indexOf('{', h);
  let d = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (d === 0) return src.slice(i, k + 1); }
  }
  throw new Error('fim não achado: ' + caminho);
}

// Remove comentários para as asserções de fonte não casarem com os próprios
// comentários da correção (que citam `_resolveEmpresaUuid` / `emp_id`).
function semComentarios(s) {
  return s.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
}

// ── F-3 real em sandbox ────────────────────────────────────────────────────
const ctx = {
  console,
  corrigirUuid: empresa.corrigirUuid,
  EMPRESAS_FALLBACK: empresa.EMPRESAS_FALLBACK,
};
vm.createContext(ctx);
vm.runInContext(
  ['_relatoriosIsAllCompaniesSentinel', '_isUuid', '_relatoriosLegacyEmpresaUuid',
    '_empresaSiglaPorUuid', '_empresaFiltro', '_aplicarFiltroEmpresaOfs']
    .map((n) => extrairFunc(SRC, n)).join('\n'),
  ctx
);

const plain = (v) => JSON.parse(JSON.stringify(v));

function qRec() {
  const chamadas = [];
  const self = {
    chamadas,
    eq(c, v) { chamadas.push(['eq', c, v]); return self; },
    or(expr) { chamadas.push(['or', expr]); return self; },
  };
  return self;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1) _empresaFiltro: Todas/E1/E2/E3/UUID
// ═══════════════════════════════════════════════════════════════════════════
test('REL-02: siglas E1/E2/E3 resolvem para o UUID canônico + sigla', () => {
  assert.deepStrictEqual(plain(ctx._empresaFiltro({ query: { emp_id: 'E1' } })), { todas: false, uuid: ITALY, sigla: 'ITALY' });
  assert.deepStrictEqual(plain(ctx._empresaFiltro({ query: { emp_id: 'E2' } })), { todas: false, uuid: CARTO, sigla: 'CARTO' });
  assert.deepStrictEqual(plain(ctx._empresaFiltro({ query: { emp_id: 'E3' } })), { todas: false, uuid: OESTE, sigla: 'OESTE' });
});

test('REL-02: "Todas" (todas_empresas=1 / all / vazio) -> { todas: true }', () => {
  assert.deepStrictEqual(plain(ctx._empresaFiltro({ query: { todas_empresas: '1' } })), { todas: true });
  assert.deepStrictEqual(plain(ctx._empresaFiltro({ query: { emp_id: 'all' } })), { todas: true });
  assert.deepStrictEqual(plain(ctx._empresaFiltro({ query: { emp_id: 'todas' } })), { todas: true });
  assert.deepStrictEqual(plain(ctx._empresaFiltro({ query: {} })), { todas: true });
});

test('REL-02: UUID conhecido resolve a sigla; UUID desconhecido fica sem sigla', () => {
  assert.deepStrictEqual(plain(ctx._empresaFiltro({ query: { emp_id: OESTE } })), { todas: false, uuid: OESTE, sigla: 'OESTE' });
  const desconhecido = '11111111-2222-4333-8444-555555555555';
  assert.deepStrictEqual(plain(ctx._empresaFiltro({ query: { emp_id: desconhecido } })), { todas: false, uuid: desconhecido, sigla: '' });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2) _aplicarFiltroEmpresaOfs: OR por UUID+sigla / eq por UUID / intacto
// ═══════════════════════════════════════════════════════════════════════════
test('REL-02: E3 -> OR empresa_id.eq.<OESTE> ou (empresa_id null e emp_id=E3)', () => {
  const q = qRec();
  const out = ctx._aplicarFiltroEmpresaOfs(q, ctx._empresaFiltro({ query: { emp_id: 'E3' } }));
  assert.equal(out, q, 'deve devolver o próprio query builder');
  assert.deepStrictEqual(q.chamadas, [
    ['or', 'empresa_id.eq.' + OESTE + ',and(empresa_id.is.null,emp_id.eq.OESTE)'],
  ]);
});

test('REL-02: Todas -> query intacta (nenhum filtro)', () => {
  const q = qRec();
  const out = ctx._aplicarFiltroEmpresaOfs(q, ctx._empresaFiltro({ query: { todas_empresas: '1' } }));
  assert.equal(out, q);
  assert.equal(q.chamadas.length, 0);
});

test('REL-02: UUID sem sigla conhecida -> eq(empresa_id, uuid)', () => {
  const q = qRec();
  const uuid = '11111111-2222-4333-8444-555555555555';
  ctx._aplicarFiltroEmpresaOfs(q, ctx._empresaFiltro({ query: { emp_id: uuid } }));
  assert.deepStrictEqual(q.chamadas, [['eq', 'empresa_id', uuid]]);
});

// ═══════════════════════════════════════════════════════════════════════════
// 3) Todas as rotas do REL-02 passam pelo filtro único F-3
// ═══════════════════════════════════════════════════════════════════════════
const ROTAS_REL02 = [
  '/api/relatorios/clientes-inativos',
  '/api/relatorios/ofs-entradas-mes',
  '/api/relatorios/cores-tamanhos',
  '/api/relatorios/maiores-tamanhos-vendidos',
  '/api/relatorios/vendas-por-ramo',
  '/api/relatorios/vendas-por-cidade-estado',
  '/api/relatorios/controle-vendas-vendedor',
  '/api/relatorios/custos',
  '/api/relatorios/tipos-caixa',
  '/api/relatorios/clientes-mais-compraram',
  '/api/relatorios/cliente-ficha',
  '/api/relatorios/perdas-altas',
  '/api/analises/toneladas-vendidas',
  '/api/caixas-perdidas/dashboard',
  '/api/passagens/historico',
];

for (const rota of ROTAS_REL02) {
  test('REL-02: ' + rota + ' usa _empresaFiltro (F-3)', () => {
    const src = semComentarios(extrairRota(SRC, rota));
    assert.ok(/_empresaFiltro\(req\)/.test(src), 'deve chamar _empresaFiltro(req)');
  });

  test('REL-02: ' + rota + ' não usa mais o resolver antigo', () => {
    const src = semComentarios(extrairRota(SRC, rota));
    assert.ok(!/_resolveEmpresaUuid\(/.test(src), 'não pode usar _resolveEmpresaUuid');
    assert.ok(!/_relatoriosResolveEmpresaFilter\(/.test(src), 'não pode usar _relatoriosResolveEmpresaFilter');
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 4) Rotas que consultam `ofs` aplicam _aplicarFiltroEmpresaOfs
// ═══════════════════════════════════════════════════════════════════════════
const ROTAS_OFS_DIRETO = [
  '/api/relatorios/cores-tamanhos',
  '/api/relatorios/maiores-tamanhos-vendidos',
  '/api/relatorios/custos',
  '/api/relatorios/tipos-caixa',
  '/api/analises/toneladas-vendidas',
];
for (const rota of ROTAS_OFS_DIRETO) {
  test('REL-02: ' + rota + ' aplica _aplicarFiltroEmpresaOfs', () => {
    const src = semComentarios(extrairRota(SRC, rota));
    assert.ok(/_aplicarFiltroEmpresaOfs\(/.test(src), 'deve aplicar _aplicarFiltroEmpresaOfs');
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 5) Tabelas de perdas filtram por emp_id (sigla)
// ═══════════════════════════════════════════════════════════════════════════
test('REL-02: perdas-altas filtra a tabela de perdas por emp_id', () => {
  const src = semComentarios(extrairRota(SRC, '/api/relatorios/perdas-altas'));
  assert.ok(/\.eq\('emp_id',\s*_paEmpSigla\)/.test(src), 'deve filtrar .eq(emp_id, sigla)');
});

test('REL-02: caixas-perdidas/dashboard filtra a tabela de perdas por emp_id', () => {
  const src = semComentarios(extrairRota(SRC, '/api/caixas-perdidas/dashboard'));
  assert.ok(/\.eq\('emp_id',\s*_cpEmpSigla\)/.test(src), 'deve filtrar .eq(emp_id, sigla)');
});

test('REL-02: tipos-caixa filtra o cadastro de tipos por emp_id (sigla)', () => {
  const src = semComentarios(extrairRota(SRC, '/api/relatorios/tipos-caixa'));
  assert.ok(/\.eq\('emp_id',\s*filtroEmp\.sigla\)/.test(src), 'lookup de tipos_caixa deve filtrar por sigla');
});

// ═══════════════════════════════════════════════════════════════════════════
// 6) Front: rrApiUrl injeta o filtro de empresa em todas as chamadas novas
// ═══════════════════════════════════════════════════════════════════════════
test('REL-02 (front): rrApiUrl monta a URL com rrEmpresaQueryParts()', () => {
  const fn = extrairFunc(PATCH, 'rrApiUrl');
  assert.ok(/rrEmpresaQueryParts\(\)/.test(fn), 'deve incluir o filtro de empresa da Central');
});

test('REL-02 (front): os relatórios usam rrApiUrl (>= 20 chamadas migradas)', () => {
  const ocorrencias = (PATCH.match(/rrApiUrl\('\/api\//g) || []).length;
  assert.ok(ocorrencias >= 20, 'esperado >= 20 chamadas via rrApiUrl, encontrado ' + ocorrencias);
});

test('REL-02 (front): rrReportVendasPorRamo envia o filtro de empresa', () => {
  const fn = extrairFunc(PATCH, 'rrReportVendasPorRamo');
  assert.ok(/rrApiUrl\('\/api\/relatorios\/vendas-por-ramo'/.test(fn), 'deve montar a URL via rrApiUrl');
});

test('REL-02 (front): rrReportOfsEmAberto respeita o filtro da Central no modo Empresa atual', () => {
  const fn = extrairFunc(PATCH, 'rrReportOfsEmAberto');
  assert.ok(/rrEmpresaQueryParts\(\)/.test(fn), 'deve usar rrEmpresaQueryParts no modo "Empresa atual"');
});

// ═══════════════════════════════════════════════════════════════════════════
// 7) Impressão mostra o escopo (Empresa + Critério de data)
// ═══════════════════════════════════════════════════════════════════════════
test('REL-02 (front): rrOpenPrint injeta o escopo "Empresa: ... Critério de data: ..."', () => {
  const fn = extrairFunc(PATCH, 'rrOpenPrint');
  assert.ok(/out\.escopo\s*=/.test(fn), 'deve preencher out.escopo');
  assert.ok(/Empresa:\s/.test(fn), 'deve rotular a empresa');
  assert.ok(/Critério de data:\s/.test(fn), 'deve rotular o critério de data');
});

test('REL-02 (front): o HTML de impressão renderiza o escopo', () => {
  assert.ok(/class="escopo-print"/.test(PATCH), 'deve existir a div .escopo-print na impressão');
  assert.ok(/cfg\.escopo/.test(PATCH), 'o HTML deve renderizar cfg.escopo');
});
