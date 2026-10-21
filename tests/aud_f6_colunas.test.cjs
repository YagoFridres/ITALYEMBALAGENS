'use strict';
// F-6 · _soColunas — remove colunas que não existem na tabela real e loga o
// aviso UMA vez por par tabela.coluna. Usa server/colunas.js (schema real).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const server = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const COLUNAS = require(path.join(ROOT, 'server', 'colunas.js'));

function extrair(src, nome) {
  const i = src.indexOf('function ' + nome + '(');
  assert.ok(i >= 0, 'função não encontrada: ' + nome);
  let d = 0;
  const j = src.indexOf('{', i);
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (d === 0) return src.slice(i, k + 1); }
  }
  throw new Error('fim não achado: ' + nome);
}

const logs = [];
const sets = {};
Object.keys(COLUNAS).forEach((t) => {
  sets[t] = new Set((COLUNAS[t] || []).map((c) => String(c).toLowerCase()));
});

const ctx = { console: { log: (m) => logs.push(String(m)) }, _COLUNAS_SETS: sets, _soColunasAvisadas: new Set() };
vm.createContext(ctx);
vm.runInContext(extrair(server, '_soColunas'), ctx);
const soColunas = ctx._soColunas;

// Objetos devolvidos pelo contexto vm têm outro protótipo (outro realm).
const plain = (v) => JSON.parse(JSON.stringify(v));

test('F-6: mantém só as colunas reais', () => {
  const out = soColunas('ofs', { id: 'x', coluna_falsa: 1, data_entrega: '2026-10-20' });
  assert.deepStrictEqual(plain(out), { id: 'x', data_entrega: '2026-10-20' });
});

test('F-6: chave falsa é removida e logada UMA vez', () => {
  logs.length = 0;
  soColunas('ofs', { id: 'a', coluna_falsa_uma_vez: 1 });
  soColunas('ofs', { id: 'b', coluna_falsa_uma_vez: 2 });
  const doAviso = logs.filter((m) => m.indexOf('ofs.coluna_falsa_uma_vez') >= 0);
  assert.strictEqual(doAviso.length, 1, 'o aviso deve sair apenas uma vez');
  assert.ok(doAviso[0].indexOf('[AUD][F-6] coluna inexistente removida') >= 0);
});

test('F-6: comparação é case-insensitive (coluna real em caixa alta fica)', () => {
  const out = soColunas('ofs', { ID: 'x', Data_Entrega: '2026-10-20' });
  assert.deepStrictEqual(plain(out), { ID: 'x', Data_Entrega: '2026-10-20' });
});

test('F-6: tabela desconhecida / não-objeto passam intactos', () => {
  const obj = { qualquer: 1, outra: 2 };
  const out = soColunas('tabela_inexistente', obj);
  assert.strictEqual(out, obj);
  assert.strictEqual(soColunas('ofs', null), null);
  const arr = [1, 2];
  assert.strictEqual(soColunas('ofs', arr), arr);
});

test('F-6: aviso também dispara para cada par tabela.coluna distinto', () => {
  logs.length = 0;
  soColunas('orcamentos', { id: '1', x_falsa: 1 });
  soColunas('orcamentos', { id: '1', y_falsa: 1 });
  const pares = logs.filter((m) => m.indexOf('[AUD][F-6]') >= 0).map((m) => m.split(': ').pop());
  assert.deepStrictEqual(pares.sort(), ['orcamentos.x_falsa', 'orcamentos.y_falsa']);
});
