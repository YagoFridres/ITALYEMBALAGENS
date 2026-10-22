'use strict';
// REL-07 · Relatórios de Papelão zerados.
// A API devolve { ok, data } e o front lia o objeto raiz:
//   - rrReportPapelaoFornecedor: rows = Array.isArray(json) ? json : []  -> 0 linhas
//   - rrReportPapelaoResumoMes:  resumo = json -> cards zerados
// Correto: rows = rrList(json, ['data']) e resumo = json.data || json.
//
// Roda as funções REAIS extraídas de patch.js num sandbox vm (sem navegador).
//
// Rodar: node --test tests/aud_rel07_papelao_data.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const PATCH = fs.readFileSync(path.join(ROOT, 'patch.js'), 'utf8');

function extrairFunc(src, marcador) {
  const i = src.indexOf(marcador);
  assert.ok(i >= 0, 'não achei: ' + marcador);
  const prefixo = src.slice(Math.max(0, i - 6), i) === 'async ' ? 'async ' : '';
  let d = 0;
  let j = src.indexOf('(', i);
  for (let k = j; k < src.length; k++) {
    if (src[k] === '(') d++;
    else if (src[k] === ')') { d--; if (d === 0) { j = src.indexOf('{', k); break; } }
  }
  assert.ok(j > i, 'corpo não achado: ' + marcador);
  d = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (d === 0) return prefixo + src.slice(i, k + 1); }
  }
  throw new Error('fim não achado: ' + marcador);
}

async function rodar(fn, json) {
  const capturado = { print: null, url: null };
  const ctx = {
    console: { log() {}, warn() {}, error() {} },
    encodeURIComponent,
    rrCurrentRange: () => ({ data_inicio: '2026-09-01', data_fim: '2026-09-30', titulo: '09/2026' }),
    rrEmpresaQueryParts: () => ['emp=all'],
    rrFetchJson: async (url) => { capturado.url = url; return json; },
    rrOpenPrint: (p) => { capturado.print = p; },
    rrFmtNum: (v) => String(v),
    rrFmtMoney: (v) => String(v),
    rrEsc: (s) => String(s),
    rrList: null,
  };
  vm.createContext(ctx);
  vm.runInContext(extrairFunc(PATCH, 'function rrList('), ctx);
  vm.runInContext(extrairFunc(PATCH, fn), ctx);
  const nome = fn.replace('async function ', '').replace('(', '');
  await ctx[nome]({ data_inicio: '2026-09-01', data_fim: '2026-09-30', titulo: '09/2026' });
  return capturado;
}

const FORNECEDOR = 'async function rrReportPapelaoFornecedor(';
const RESUMO = 'async function rrReportPapelaoResumoMes(';

test('REL-07 fonte: fornecedor usa rrList(json,[data]) e resumo usa json.data', () => {
  const iF = PATCH.indexOf(FORNECEDOR);
  const blocoF = PATCH.slice(iF, iF + 1400);
  assert.ok(/Array\.isArray\(json\)\s*\?\s*json\s*:\s*rrList\(json,\s*\['data'\]\)/.test(blocoF), 'rows deve cair em rrList(json,[data])');
  assert.ok(!/Array\.isArray\(json\)\s*\?\s*json\s*:\s*\[\]/.test(blocoF), 'não pode voltar a devolver []');
  const iR = PATCH.indexOf(RESUMO);
  const blocoR = PATCH.slice(iR, iR + 1400);
  assert.ok(/\(json && json\.data\) \|\| json \|\| \{\}/.test(blocoR), 'resumo deve usar json.data || json');
});

test('REL-07 fornecedor: linhas dentro de data são lidas (não zerado)', async () => {
  const json = {
    ok: true,
    data: [
      { fornecedor: 'KRAFT SA', total_compras: 2, quantidade: 200, area_m2: 50.5, valor_total: 1000 },
      { fornecedor: 'BRANCO LTDA', total_compras: 1, quantidade: 100, area_m2: 20, valor_total: 500 },
    ],
  };
  const { print } = await rodar(FORNECEDOR, json);
  assert.ok(print, 'rrOpenPrint não chamado');
  // cards: [Fornecedores, Compras, Quantidade, Área, Valor]
  assert.equal(print.cards[0].value, '2', 'Fornecedores');
  assert.equal(print.cards[1].value, '3', 'Compras');
  assert.equal(print.cards[2].value, '300', 'Quantidade (chapas)');
  assert.equal(print.summaryRows.length, 2, 'deve listar os 2 fornecedores');
  assert.equal(String(print.summaryRows[0][0]), 'KRAFT SA');
});

test('REL-07 fornecedor: raiz em array (formato antigo) continua funcionando', async () => {
  const json = [{ fornecedor: 'X', total_compras: 1, quantidade: 10, area_m2: 1, valor_total: 100 }];
  const { print } = await rodar(FORNECEDOR, json);
  assert.equal(print.summaryRows.length, 1);
  assert.equal(print.cards[1].value, '1');
});

test('REL-07 resumo: cards leem os números de data', async () => {
  const json = { ok: true, data: { total_compras: 3, quantidade: 200, area_m2: 123.45, valor_total: 9000 } };
  const { print } = await rodar(RESUMO, json);
  assert.equal(print.cards[0].value, '3', 'Total de Compras');
  assert.equal(print.cards[1].value, '200', 'Quantidade Total');
  assert.equal(print.cards[3].value, '9000', 'Valor Total');
});

test('REL-07 resumo: raiz em objeto (formato antigo) continua funcionando', async () => {
  const json = { total_compras: 4, quantidade: 400, area_m2: 10, valor_total: 100 };
  const { print } = await rodar(RESUMO, json);
  assert.equal(print.cards[0].value, '4');
  assert.equal(print.cards[1].value, '400');
});

test('REL-07 resumo: resposta vazia não quebra', async () => {
  const { print } = await rodar(RESUMO, {});
  assert.equal(print.cards[0].value, '0');
  assert.equal(print.cards[1].value, '0');
});
