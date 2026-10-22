'use strict';
// REL-09 · Relatórios cortados sem aviso.
// Várias rotas pediam mais linhas do que o PostgREST entrega (o teto real é 1000)
// e o `range` era maior que o teto → o relatório voltava truncado SEM aviso:
//   - /api/relatorios/perdas-altas      → `.limit(5000)`
//   - /api/relatorios/custos            → `.limit(900)`
//   - /api/clientes/ranking             → `pageSize 10000` (fechava na 1ª página)
//   - /api/relatorio/vendedor           → `.limit(150)`
//   - /api/relatorio/resultado-empresas → `.limit(5000)`
//   - rrReportPassagens (front)         → card usava `rows.length` (limitado à página)
// Correção: F-4 (`_fetchTodasPaginas`, pageSize 1000) nas rotas e o card usando o
// `total` real do servidor + aviso "mostrando X de Y".
//
// Roda rotas/funções REAIS extraídas do fonte num sandbox vm (sem banco).
//
// Rodar: node --test tests/aud_rel09_sem_cortes.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8').replace(/\r\n/g, '\n');
const PATCH = fs.readFileSync(path.join(ROOT, 'patch.js'), 'utf8').replace(/\r\n/g, '\n');

const ITALY = 'df5f7672-0a6b-402d-ae65-296554236c31';

// ── extratores ──────────────────────────────────────────────────────────────
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

function extrairHandler(src, caminho) {
  const rota = extrairRota(src, caminho);
  const h = rota.indexOf('async (req, res) => {');
  return rota.slice(h);
}

// Remove linhas de comentário para as asserções de fonte não casarem com os
// próprios comentários da correção (que citam os `.limit(...)` antigos).
function semComentarios(s) {
  return s.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
}

// ── _fetchTodasPaginas real em sandbox ──────────────────────────────────────
function ctxPaginador() {
  const ctx = { console: { log() {}, warn() {}, error() {} } };
  vm.createContext(ctx);
  vm.runInContext(extrairFunc(SRC, '_fetchTodasPaginas'), ctx);
  return ctx;
}

// ── Supabase falso com teto de página do PostgREST (1000) ──────────────────
function fakeSupabase({ bases = {}, pageCap = 1000, erroDeColuna = null } = {}) {
  const calls = [];
  function builder(tabela) {
    const st = { tabela, cols: '', filtros: [], from: null, to: null };
    const self = {
      select(cols) { st.cols = String(cols || ''); return self; },
      eq(c, v) { st.filtros.push(['eq', c, v]); return self; },
      not(c, op, v) { st.filtros.push(['not', c, op, v]); return self; },
      ilike(c, v) { st.filtros.push(['ilike', c, v]); return self; },
      is(c, v) { st.filtros.push(['is', c, v]); return self; },
      or(expr) { st.filtros.push(['or', expr]); return self; },
      order() { return self; },
      range(from, to) { st.from = from; st.to = to; return self; },
      then(resolve, reject) {
        calls.push(st);
        if (erroDeColuna && st.cols && st.cols.split(',').map((s) => s.trim()).includes(erroDeColuna)) {
          const msg = "Could not find the '" + erroDeColuna + "' column '" + tabela + "' in the schema cache";
          return Promise.resolve({ data: null, error: { message: msg } }).then(resolve, reject);
        }
        const base = bases[tabela] || [];
        const from = st.from == null ? 0 : st.from;
        const to = st.to == null ? base.length - 1 : st.to;
        const cap = Math.min(pageCap, to - from + 1);
        return Promise.resolve({ data: base.slice(from, from + cap), error: null }).then(resolve, reject);
      },
    };
    return self;
  }
  return { from: (t) => builder(t), calls };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1) F-4: paginação real (pageSize 1000) não corta em 1000
// ═══════════════════════════════════════════════════════════════════════════
test('REL-09: _fetchTodasPaginas lê 2500 registros em 3 páginas de 1000', async () => {
  const ctx = ctxPaginador();
  let chamadas = 0;
  const rows = await ctx._fetchTodasPaginas(async (from, to) => {
    chamadas++;
    const n = Math.max(0, Math.min(1000, to - from + 1, 2500 - from));
    return Array.from({ length: n }, (_, i) => ({ id: from + i }));
  }, { pageSize: 1000 });
  assert.equal(rows.length, 2500);
  assert.equal(chamadas, 3);
});

// ═══════════════════════════════════════════════════════════════════════════
// 2) perdas-altas: sem `.limit(5000)`, usa F-4 pageSize 1000
// ═══════════════════════════════════════════════════════════════════════════
test('REL-09 (perdas-altas): troca .limit(5000) por F-4 pageSize 1000', () => {
  const rota = semComentarios(extrairRota(SRC, '/api/relatorios/perdas-altas'));
  assert.ok(!/\.limit\(5000\)/.test(rota), 'não pode continuar com .limit(5000)');
  assert.ok(/_fetchTodasPaginas\(/.test(rota), 'deve usar _fetchTodasPaginas (F-4)');
  assert.ok(/pageSize:\s*1000/.test(rota), 'pageSize deve ser 1000');
  assert.ok(/\.range\(from,\s*to\)/.test(rota), 'deve paginar por range');
});

// ═══════════════════════════════════════════════════════════════════════════
// 3) resultado-empresas: sem `.limit(5000)`, usa F-4 pageSize 1000
// ═══════════════════════════════════════════════════════════════════════════
test('REL-09 (resultado-empresas): troca .limit(5000) por F-4 pageSize 1000', () => {
  const rota = semComentarios(extrairRota(SRC, '/api/relatorio/resultado-empresas'));
  assert.ok(!/\.limit\(5000\)/.test(rota), 'não pode continuar com .limit(5000)');
  assert.ok(/_fetchTodasPaginas\(/.test(rota), 'deve usar _fetchTodasPaginas (F-4)');
  assert.ok(/pageSize:\s*1000/.test(rota), 'pageSize deve ser 1000');
  assert.ok(/\.range\(from,\s*to\)/.test(rota), 'deve paginar por range');
});

// ═══════════════════════════════════════════════════════════════════════════
// 4) custos: sem `.limit(900)`, pagina por range pageSize 1000
// ═══════════════════════════════════════════════════════════════════════════
test('REL-09 (custos): troca .limit(900) por paginação real', () => {
  const rota = semComentarios(extrairRota(SRC, '/api/relatorios/custos'));
  assert.ok(!/\.limit\(900\)/.test(rota), 'não pode continuar com .limit(900)');
  assert.ok(/ofsPageSize\s*=\s*1000/.test(rota), 'pageSize deve ser 1000');
  assert.ok(/\.range\(de,\s*de\s*\+\s*ofsPageSize\s*-\s*1\)/.test(rota), 'deve paginar por range');
  assert.ok(/ofs\.push\(\.\.\.lote\)/.test(rota), 'deve acumular as páginas');
});

// ═══════════════════════════════════════════════════════════════════════════
// 5) vendedor: sem `.limit(150)` no selectWithRetry
// ═══════════════════════════════════════════════════════════════════════════
test('REL-09 (vendedor): selectWithRetry pagina em vez de .limit(150)', () => {
  const rota = semComentarios(extrairRota(SRC, '/api/relatorio/vendedor'));
  assert.ok(!/\.limit\(150\)/.test(rota), 'não pode continuar com .limit(150)');
  assert.ok(/_fetchTodasPaginas\(/.test(rota), 'deve usar _fetchTodasPaginas (F-4)');
  assert.ok(/pageSize:\s*1000/.test(rota), 'pageSize deve ser 1000');
  assert.ok(/\.range\(from,\s*to\)/.test(rota), 'deve paginar por range');
});

// ═══════════════════════════════════════════════════════════════════════════
// 6) selectWithRetry REAL: devolve > 150 linhas e mantém o retry de coluna
// ═══════════════════════════════════════════════════════════════════════════
async function montarSelectWithRetry(erroDeColuna) {
  const rota = extrairRota(SRC, '/api/relatorio/vendedor');
  const i = rota.indexOf('const selectWithRetry = async (table, cols, build) => {');
  assert.ok(i >= 0, 'selectWithRetry não encontrado');
  const arrowIni = rota.indexOf('async (table, cols, build) => {', i);
  const j = rota.indexOf('{', rota.indexOf('=>', arrowIni));
  let d = 0;
  let fim = -1;
  for (let k = j; k < rota.length; k++) {
    if (rota[k] === '{') d++;
    else if (rota[k] === '}') { d--; if (d === 0) { fim = k; break; } }
  }
  assert.ok(fim > 0, 'fim do selectWithRetry não encontrado');
  const expr = rota.slice(arrowIni, fim + 1);
  const ctx = { console: { log() {}, warn() {}, error() {} } };
  vm.createContext(ctx);
  vm.runInContext(extrairFunc(SRC, '_fetchTodasPaginas'), ctx);
  vm.runInContext('var selectWithRetry = ' + expr + ';', ctx);
  return ctx;
}

test('REL-09 (selectWithRetry): 1500 OFs são todas retornadas (nada cortado em 150)', async () => {
  const OFS = Array.from({ length: 1500 }, (_, i) => ({ id: 'of-' + i }));
  const ctx = await montarSelectWithRetry(null);
  ctx.supabase = fakeSupabase({ bases: { ofs: OFS } });
  const r = await vm.runInContext('selectWithRetry("ofs", ["id"], (q) => q)', ctx);
  assert.equal(r.data.length, 1500);
});

test('REL-09 (selectWithRetry): retry continua descartando coluna inexistente', async () => {
  const OFS = Array.from({ length: 20 }, (_, i) => ({ id: 'of-' + i }));
  const ctx = await montarSelectWithRetry('vendedor_nome');
  ctx.supabase = fakeSupabase({ bases: { ofs: OFS }, erroDeColuna: 'vendedor_nome' });
  const r = await vm.runInContext(
    'selectWithRetry("ofs", ["id","vendedor_nome"], (q) => q)',
    ctx
  );
  assert.ok(!r.usedCols.includes('vendedor_nome'), 'a coluna inexistente deve sair');
  assert.equal(r.data.length, 20);
});

// ═══════════════════════════════════════════════════════════════════════════
// 7) ranking REAL: cliente além da 1ª página (1000) aparece no ranking
// ═══════════════════════════════════════════════════════════════════════════
test('REL-09 (ranking): cliente fora da 1ª página entra no ranking (sem corte)', async () => {
  const clientes = Array.from({ length: 1500 }, (_, i) => ({ id: 'c' + i, nome: 'Cliente ' + i, ativo: true }));
  const ofs = [];
  for (let i = 0; i < 2000; i++) ofs.push({ cli_id: 'c' + (i % 1000), valor_total: 10 }); // só 1ª página de clientes
  for (let i = 0; i < 200; i++) ofs.push({ cli_id: 'c1200', valor_total: 1000 }); // marcador, além do teto de OFs

  const ctx = { console: { log() {}, warn() {}, error() {} } };
  vm.createContext(ctx);
  vm.runInContext(extrairFunc(SRC, '_fetchTodasPaginas'), ctx);
  ctx.supabase = fakeSupabase({ bases: { clientes, ofs } });
  ctx._resolveEmpresaUuid = async () => ITALY;
  // F-3 (REL-14): a rota agora monta o filtro de empresa; aqui não é o alvo do
  // teste (que é a paginação), então bastam stubs neutros.
  ctx._empresaSiglaPorUuid = () => 'ITALY';
  ctx._aplicarFiltroEmpresaOfs = (q) => q;

  const handler = vm.runInContext('(' + extrairHandler(SRC, '/api/clientes/ranking') + ')', ctx);
  const captura = { status: null, body: null };
  const res = {
    json(b) { captura.status = 200; captura.body = b; return res; },
    status(c) { captura.status = c; return { json(b) { captura.status = c; captura.body = b; } }; },
  };
  await handler({ query: { tipo: 'quantidade', limit: '1' }, usuario: {} }, res);

  assert.equal(captura.status, 200);
  assert.ok(Array.isArray(captura.body?.data), 'deve devolver data');
  assert.equal(captura.body.data.length, 1);
  assert.equal(captura.body.data[0].id, 'c1200', 'o cliente além do teto deve ser o 1º do ranking');
  assert.equal(captura.body.data[0].total_ofs, 200);
});

// ═══════════════════════════════════════════════════════════════════════════
// 8) front: card de Passagens usa o total real e avisa "mostrando X de Y"
// ═══════════════════════════════════════════════════════════════════════════
test('REL-09 (passagens, front): card usa total do servidor e avisa o corte', () => {
  const fn = extrairFunc(PATCH, 'rrReportPassagens');
  assert.ok(/json\.total/.test(fn), 'deve ler o total do servidor');
  assert.ok(/totalPassagens/.test(fn), 'deve usar totalPassagens no card');
  assert.ok(/Mostrando/.test(fn), 'deve avisar "mostrando X de Y"');
  assert.ok(!/label: 'Passagens', value: rrFmtNum\(rows\.length, 0\), sub: 'Linhas no período'/.test(fn),
    'o card não pode continuar usando rows.length');
});
