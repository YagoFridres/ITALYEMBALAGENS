'use strict';

/**
 * AUD-4 · Paginação segura de /api/ofs (orçamento de tempo + teto de páginas + single-flight).
 *
 * Carrega SOMENTE o bloco de paginação do server.js (buscarTodasOFsPaginadas,
 * buscarTodasOFsPaginadasSingleFlight e as constantes de orçamento) em um sandbox vm
 * com um montador de query FALSO (dados fictícios, sem banco). Valida:
 *   - o conjunto COMPLETO de OFs é preservado quando dentro do orçamento;
 *   - ao estourar o orçamento de TEMPO, lança erro EXPLÍCITO (nunca devolve lista truncada);
 *   - ao estourar o TETO DE PÁGINAS, lança erro EXPLÍCITO;
 *   - requisições idênticas e concorrentes (single-flight) compartilham UMA única paginação;
 *   - chaves diferentes NÃO compartilham;
 *   - o handler /api/ofs mapeia os códigos de paginação para HTTP 503 (explícito).
 *
 * Sem banco. Rodar: node --test tests/aud4_ofs_paginacao.test.cjs
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const MARCADOR_INI = 'const OFS_FULL_LOAD_DEADLINE_MS';
const MARCADOR_FIM = "app.get('/api/ofs', authMiddleware";

function blocoPaginacao() {
  const ini = SRC.indexOf(MARCADOR_INI);
  const fim = SRC.indexOf(MARCADOR_FIM, ini);
  assert.ok(ini > 0, 'bloco de paginação (OFS_FULL_LOAD_DEADLINE_MS) não encontrado em server.js');
  assert.ok(fim > ini, 'marcador de fim (app.get /api/ofs) não encontrado');
  return SRC.slice(ini, fim);
}

// Monta um sandbox com o bloco de paginação e um relógio controlável.
function criarAmbiente(opcoes = {}) {
  const clock = { v: Number(opcoes.agora) || 0 };
  const sandbox = {
    console: { log() {}, warn() {}, error() {} },
    process: { env: {} },
    Date: { now: () => clock.v },
  };
  vm.createContext(sandbox);
  vm.runInContext(blocoPaginacao(), sandbox);
  return { sandbox, clock };
}

// Montador de query falso: devolve `total` linhas fictícias paginadas em blocos de `pageSize`,
// expondo `.range(from,to)` como o builder do Supabase/PostgREST.
function montadorFalso(total, opts = {}) {
  const pageSize = Number(opts.pageSize) || 500;
  const state = { calls: 0, froms: [] };
  const montar = () => ({
    range(from, to) {
      state.calls++;
      state.froms.push(from);
      if (opts.onCall) opts.onCall(state.calls, from);
      if (opts.failOnCall === state.calls) {
        return Promise.resolve({ data: null, error: { message: 'erro simulado de banco', code: 'XX000' }, count: null });
      }
      const n = Math.max(0, Math.min(pageSize, to - from + 1, total - from));
      const data = [];
      for (let i = 0; i < n; i++) data.push({ id: 'of-' + (from + i), idx: from + i, status: 'aberta' });
      return Promise.resolve({ data, count: total });
    },
  });
  return { montar, state };
}

test('preserva o conjunto COMPLETO de OFs (4112 fictícias) e informa páginas/tempo', async () => {
  const { sandbox } = criarAmbiente();
  const { montar, state } = montadorFalso(4112, { pageSize: 500 });

  const r = await sandbox.buscarTodasOFsPaginadas(montar);

  assert.equal(r.data.length, 4112, 'todas as OFs devem ser retornadas (nenhum corte artificial)');
  assert.equal(r.count, 4112, 'o total deve refletir o count do banco');
  assert.equal(r.paginas, 9, '4112 / 500 => 9 páginas');
  assert.equal(state.calls, 9, 'deve paginar até esgotar as linhas');
  assert.equal(r.data[0].idx, 0);
  assert.equal(r.data[4111].idx, 4111);
  assert.ok(typeof r.decorridoMs === 'number');
});

test('volume exatamente múltiplo da página: para no primeiro lote vazio (sem duplicar)', async () => {
  const { sandbox } = criarAmbiente();
  const { montar, state } = montadorFalso(1000, { pageSize: 500 });

  const r = await sandbox.buscarTodasOFsPaginadas(montar);

  assert.equal(r.data.length, 1000);
  assert.equal(r.count, 1000);
  // from=0 (500), from=500 (500) -> ambos cheios; from=1000 devolve vazio -> break.
  assert.equal(state.calls, 3, 'deve fazer 1 requisição vazia final para encerrar');
});

test('estouro do orçamento de TEMPO: lança erro EXPLÍCITO e NÃO devolve lista truncada', async () => {
  const { sandbox, clock } = criarAmbiente();
  // Cada página "gasta" 20s. deadline default = 120000ms.
  const { montar } = montadorFalso(500000, { pageSize: 500, onCall: () => { clock.v += 20000; } });

  let erro = null;
  let resultado = null;
  try {
    resultado = await sandbox.buscarTodasOFsPaginadas(montar, { deadlineMs: 120000 });
  } catch (e) {
    erro = e;
  }

  assert.ok(erro, 'deveria lançar erro de orçamento de tempo');
  assert.equal(resultado, null, 'NÃO pode devolver resultado (nem truncado) quando estoura o tempo');
  assert.equal(erro.code, 'OFS_PAGINACAO_TIMEOUT');
  assert.match(String(erro.message), /timeout de orçamento de tempo/);
  assert.match(String(erro.details), /decorridoMs=/);
});

test('estouro do TETO DE PÁGINAS: lança erro EXPLÍCITO (guarda contra laço infinito)', async () => {
  const { sandbox } = criarAmbiente();
  const { montar, state } = montadorFalso(500000, { pageSize: 500 });

  let erro = null;
  try {
    await sandbox.buscarTodasOFsPaginadas(montar, { maxPages: 2, deadlineMs: 999999999 });
  } catch (e) {
    erro = e;
  }

  assert.ok(erro, 'deveria lançar erro de teto de páginas');
  assert.equal(erro.code, 'OFS_PAGINACAO_TETO_PAGINAS');
  assert.equal(state.calls, 2, 'não deve passar do teto de páginas');
});

test('erro de banco no meio da paginação é propagado (sem mascarar como sucesso)', async () => {
  const { sandbox } = criarAmbiente();
  const { montar } = montadorFalso(4112, { pageSize: 500, failOnCall: 3 });

  let erro = null;
  try {
    await sandbox.buscarTodasOFsPaginadas(montar);
  } catch (e) {
    erro = e;
  }

  assert.ok(erro, 'erro de banco deve ser propagado');
  assert.equal(erro.message, 'erro simulado de banco');
});

test('single-flight: requisições idênticas concorrentes compartilham UMA única paginação', async () => {
  const { sandbox } = criarAmbiente();
  const { montar, state } = montadorFalso(4112, { pageSize: 500 });

  const chave = 'ofs_full|emp1|0|1|||...|0|';
  const chamadas = Array.from({ length: 8 }, () =>
    sandbox.buscarTodasOFsPaginadasSingleFlight(chave, montar)
  );
  const resultados = await Promise.all(chamadas);

  assert.equal(state.calls, 9, 'as 8 requisições concorrentes devem gerar apenas 9 chamadas ao banco (1 carga completa)');
  resultados.forEach((r, i) => {
    assert.equal(r.data.length, 4112, 'cada requisição recebe o conjunto completo (#' + i + ')');
  });
  assert.ok(resultados[0].data === resultados[1].data, 'devem compartilhar o MESMO objeto de resultado');
});

test('single-flight: chaves diferentes NÃO compartilham carga', async () => {
  const { sandbox } = criarAmbiente();
  const a = montadorFalso(1000, { pageSize: 500 });
  const b = montadorFalso(1000, { pageSize: 500 });

  const [ra, rb] = await Promise.all([
    sandbox.buscarTodasOFsPaginadasSingleFlight('key-A', a.montar),
    sandbox.buscarTodasOFsPaginadasSingleFlight('key-B', b.montar),
  ]);

  assert.equal(ra.data.length, 1000);
  assert.equal(rb.data.length, 1000);
  assert.equal(a.state.calls, 3, 'carga A deve ter suas próprias chamadas');
  assert.equal(b.state.calls, 3, 'carga B deve ter suas próprias chamadas');
});

test('single-flight: após concluir, a chave é liberada e uma nova chamada recarrega', async () => {
  const { sandbox } = criarAmbiente();
  const { montar, state } = montadorFalso(1000, { pageSize: 500 });

  const r1 = await sandbox.buscarTodasOFsPaginadasSingleFlight('k', montar);
  assert.equal(r1.data.length, 1000);
  assert.equal(state.calls, 3);

  const r2 = await sandbox.buscarTodasOFsPaginadasSingleFlight('k', montar);
  assert.equal(r2.data.length, 1000);
  assert.equal(state.calls, 6, 'a segunda chamada (após concluir) deve recarregar');
  assert.ok(r1.data !== r2.data, 'após concluir, não deve reutilizar o resultado anterior');
});

test('handler: códigos de paginação mapeiam para HTTP 503 (nunca 200 com dados incompletos)', () => {
  assert.ok(
    SRC.includes("e?.code === 'OFS_PAGINACAO_TIMEOUT'"),
    'o catch final deve tratar OFS_PAGINACAO_TIMEOUT como transitório (503)',
  );
  assert.ok(
    SRC.includes("e?.code === 'OFS_PAGINACAO_TETO_PAGINAS'"),
    'o catch final deve tratar OFS_PAGINACAO_TETO_PAGINAS como transitório (503)',
  );
  assert.ok(
    SRC.includes('buscarTodasOFsPaginadasSingleFlight(fullLoadFlightKey, buildQuery)'),
    'o caminho principal (shouldFetchAll) deve usar o single-flight',
  );
  assert.ok(
    SRC.includes("buscarTodasOFsPaginadasSingleFlight(fullLoadFlightKey + '|fb', fallbackQueryBase)"),
    'o caminho de fallback (shouldFetchAll) deve usar o single-flight',
  );
});
