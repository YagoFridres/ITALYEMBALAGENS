'use strict';
// OFMAQ-15 · Cartão do Dashboard "Passaram por máquina no mês" mostrava 0.
//
// Defeito (prompt OFMAQ-15, alto):
//   `/api/dashboard/resumo-ofs` contava só o JSON antigo `ofs.passagens_maquina`,
//   que parou em 08/09/2026; o botão "Passou pela Máquina" grava na TABELA
//   `passagens_maquina` desde set/2026. Resultado: o Dashboard mostrava 0 no mês
//   enquanto o Histórico mostrava 262.
//
// Correção (commit `8355edf`, tag [FIX-PASSAGENS-CARD]):
//   contar a TABELA `passagens_maquina` (`count(distinct of_id)`, `data_passagem`
//   no mês) somando o JSON só para datas anteriores a 09/09, sem contar a mesma
//   OF duas vezes (Sets de deduplicação).
//
// Este teste roda o BLOCO REAL da rota (extraído de server.js por casamento de
// chaves) num sandbox `vm`, com `supabase` e as OFs injetadas — sem banco, sem
// servidor, sem navegador.
//
// Rodar: node --test tests/aud_ofmaq15_passaram_maquina.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const SERVER = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8').replace(/\r\n/g, '\n');

// ── extractores ────────────────────────────────────────────────────────────
function extrairFunc(src, marcador) {
  const i = src.indexOf(marcador);
  assert.ok(i >= 0, 'não achei: ' + marcador);
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
  throw new Error('fim não achado: ' + marcador);
}
// índice da chave '}' que fecha a chave '{' em openIdx
function matchBraces(src, openIdx) {
  let d = 0;
  for (let k = openIdx; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (d === 0) return k; }
  }
  throw new Error('chaves não balanceadas a partir de ' + openIdx);
}

const F_PARSE = extrairFunc(SERVER, 'function parsePassagens(raw)');
const F_MES = extrairFunc(SERVER, 'function passagensTemDataNoMes(passagens');

// ── bloco A: laço das OFs (JSON antigo + Sets) ─────────────────────────────
const _aStart = SERVER.indexOf('const _resumoIdsOfs = new Set();');
assert.ok(_aStart >= 0, 'não achei o início do bloco de passagens (A)');
const _aFnOpen = SERVER.indexOf('{', SERVER.indexOf('rows.forEach(function(of)', _aStart));
const BLOCO_A = SERVER.slice(_aStart, matchBraces(SERVER, _aFnOpen) + 1) + ');';

// ── bloco B: consulta da TABELA passagens_maquina + catch de fallback ──────
const _bMark = SERVER.indexOf('const _passPorPagina = 1000;');
assert.ok(_bMark >= 0, 'não achei o bloco da tabela (B)');
const _bTry = SERVER.lastIndexOf('try {', _bMark);
const _bTryOpen = SERVER.indexOf('{', _bTry);
const _bTryClose = matchBraces(SERVER, _bTryOpen);
const _bCatchOpen = SERVER.indexOf('{', SERVER.indexOf('catch', _bTryClose));
const BLOCO_B = SERVER.slice(_bTry, matchBraces(SERVER, _bCatchOpen) + 1);

const MES_INI = '2026-10-01';
const MES_FIM = '2026-11-01'; // exclusivo
const HOJE = '2026-10-22';

// statusOf do Dashboard (usado só para os contadores de status; irrelevante aqui)
function statusOf(of) {
  const s = String((of && of.status) || '').toLowerCase();
  if (s.indexOf('cancel') >= 0) return 'cancelado';
  if (s.indexOf('conclu') >= 0 || s.indexOf('finaliz') >= 0) return 'concluido';
  return 'aberto';
}

// Executa o bloco REAL da rota com fontes injetadas.
//   rows        -> OFs do Dashboard (fonte JSON: of.passagens_maquina)
//   tabelaRows  -> linhas da TABELA passagens_maquina ({of_id,data_passagem})
//   tabelaErro  -> se preenchido, simula a tabela indisponível
async function rodarContagem({ rows, tabelaRows, tabelaErro }) {
  const ctx = {
    console: { log() {}, warn() {}, error() {} },
    rows: rows || [],
    hojeStr: HOJE,
    inicioMes: MES_INI,
    fimMesExclusivo: MES_FIM,
    statusOf,
    _ofClassificaUrgencia: () => ({ atrasada: false, vence3: false, urgente: false }),
    supabase: {
      from: () => ({
        select: () => ({
          range: async () => (tabelaErro ? { error: { message: tabelaErro } } : { data: (tabelaRows || []).slice() })
        })
      })
    }
  };
  vm.createContext(ctx);
  // O bloco da tabela (B) usa `await`; no fonte ele vive dentro de `app.get(...)`
  // (já async). Aqui embrulhamos num IIFE async para rodar o MESMO código.
  await vm.runInContext(
    [
      F_PARSE,
      F_MES,
      '(async function () {',
      'let abertos = 0, concluidos = 0, cancelados = 0, atrasados = 0, urgentes = 0, temUrgenteFlag = false;',
      'let ofsPassaramMaquinaCount = 0, ofsPassaramMaquinaMes = 0, ofsErros = 0;',
      'const errosOfsIds = [];',
      BLOCO_A,
      BLOCO_B,
      'globalThis.__r = { mes: ofsPassaramMaquinaMes, total: ofsPassaramMaquinaCount };',
      '})()'
    ].join('\n'),
    ctx
  );
  return { mes: ctx.__r.mes, total: ctx.__r.total };
}
// objetos do realm `vm` não são deepStrictEqual-compatíveis → normaliza p/ o realm host
const host = (v) => JSON.parse(JSON.stringify(v));

const ofJson = (id, datas) => ({
  id,
  status: 'Em aberto',
  passagens_maquina: (datas || []).map((d) => ({ data_passagem: d, maquina: 'IMP 01' }))
});

// ═════════════ 1. TABELA é a fonte (JSON parado em 08/09) ═════════════════
test('OFMAQ-15: cartão conta a TABELA passagens_maquina (não o JSON parado)', async () => {
  const r = await rodarContagem({
    rows: [ofJson('o1', []), ofJson('o2', []), ofJson('o3', [])],
    tabelaRows: [
      { of_id: 'o1', data_passagem: '2026-10-05' },
      { of_id: 'o2', data_passagem: '2026-10-19' },
      { of_id: 'o3', data_passagem: '2026-09-30' }
    ]
  });
  assert.strictEqual(r.mes, 2, 'outubro deve contar 2 OFs distintas na tabela');
  assert.strictEqual(r.total, 3, 'total deve ser as 3 OFs distintas da tabela');
});

test('OFMAQ-15: JSON antigo (datas < 09/09) ainda entra como fallback', async () => {
  const r = await rodarContagem({
    rows: [ofJson('o1', ['2026-09-08']), ofJson('o2', [])],
    tabelaRows: []
  });
  assert.strictEqual(r.total, 1, 'OF com JSON de 08/09 conta no total');
  assert.strictEqual(r.mes, 0, '08/09 não é de outubro');
});

// ═════════════ 2. sem contar a mesma OF duas vezes ════════════════════════
test('OFMAQ-15: OF presente no JSON E na tabela conta UMA vez', async () => {
  const r = await rodarContagem({
    rows: [ofJson('o1', ['2026-10-03'])],
    tabelaRows: [
      { of_id: 'o1', data_passagem: '2026-10-03' },
      { of_id: 'o1', data_passagem: '2026-10-11' }
    ]
  });
  assert.strictEqual(r.total, 1, 'duas linhas da mesma OF = 1 OF');
  assert.strictEqual(r.mes, 1, 'as duas linhas são de outubro = 1 OF no mês');
});

// ═════════════ 3. a OF precisa estar na lista do Dashboard ════════════════
test('OFMAQ-15: linha da tabela de OF fora da lista do Dashboard é ignorada', async () => {
  const r = await rodarContagem({
    rows: [ofJson('o1', [])],
    tabelaRows: [
      { of_id: 'o1', data_passagem: '2026-10-05' },
      { of_id: 'de-outro-painel', data_passagem: '2026-10-05' }
    ]
  });
  assert.strictEqual(r.mes, 1);
  assert.strictEqual(r.total, 1);
});

// ═════════════ 4. tabela indisponível → cai no JSON (não zera) ════════════
test('OFMAQ-15: tabela indisponível mantém a contagem do JSON', async () => {
  const r = await rodarContagem({
    rows: [ofJson('o1', ['2026-10-02']), ofJson('o2', ['2026-09-01'])],
    tabelaRows: [],
    tabelaErro: 'relation "passagens_maquina" does not exist'
  });
  assert.strictEqual(r.total, 2);
  assert.strictEqual(r.mes, 1);
});

// ═════════════ 5. helpers REAIS ═══════════════════════════════════════════
test('OFMAQ-15: parsePassagens aceita JSON em texto, array e null', () => {
  const ctx = { console: { log() {}, warn() {}, error() {} } };
  vm.createContext(ctx);
  vm.runInContext(F_PARSE, ctx);
  assert.deepStrictEqual(host(ctx.parsePassagens('[{"data_passagem":"2026-10-01"}]')),
    [{ data_passagem: '2026-10-01' }]);
  assert.deepStrictEqual(host(ctx.parsePassagens(null)), []);
  assert.deepStrictEqual(host(ctx.parsePassagens('nao-e-json')), []);
  assert.deepStrictEqual(host(ctx.parsePassagens([{ a: 1 }, null, 'x'])), [{ a: 1 }]);
});

test('OFMAQ-15: passagensTemDataNoMes respeita o intervalo [inicio, fim)', () => {
  const ctx = { console: { log() {}, warn() {}, error() {} } };
  vm.createContext(ctx);
  vm.runInContext(F_MES, ctx);
  const f = ctx.passagensTemDataNoMes;
  assert.strictEqual(f([{ data_passagem: '2026-10-01' }], 'data_passagem', MES_INI, MES_FIM), true);
  assert.strictEqual(f([{ data_passagem: '2026-10-31' }], 'data_passagem', MES_INI, MES_FIM), true);
  assert.strictEqual(f([{ data_passagem: '2026-11-01' }], 'data_passagem', MES_INI, MES_FIM), false);
  assert.strictEqual(f([{ data_passagem: '2026-09-30' }], 'data_passagem', MES_INI, MES_FIM), false);
  assert.strictEqual(f([], 'data_passagem', MES_INI, MES_FIM), false);
});

// ═════════════ 6. guardas estáticas na rota REAL ══════════════════════════
test('OFMAQ-15: a rota lê a tabela passagens_maquina e deriva os contadores dos Sets', () => {
  const i = SERVER.indexOf("app.get('/api/dashboard/resumo-ofs'");
  assert.ok(i >= 0, 'não achei a rota resumo-ofs');
  const j = SERVER.indexOf('app.post(', i);
  const rota = SERVER.slice(i, j > i ? j : i + 8000);
  assert.ok(/_resumoPassTotalIds = new Set\(\)/.test(rota), 'sem Set de total (dedupe)');
  assert.ok(/_resumoPassMesIds = new Set\(\)/.test(rota), 'sem Set do mês (dedupe)');
  assert.ok(/\.from\('passagens_maquina'\)\s*\.select\('of_id,data_passagem'\)/.test(rota),
    'a rota não consulta a tabela passagens_maquina(of_id,data_passagem)');
  assert.ok(/ofsPassaramMaquinaCount = _resumoPassTotalIds\.size;/.test(rota),
    'o total não é derivado do Set (risco de contagem dupla)');
  assert.ok(/ofsPassaramMaquinaMes = _resumoPassMesIds\.size;/.test(rota),
    'o mês não é derivado do Set (risco de contagem dupla)');
});
