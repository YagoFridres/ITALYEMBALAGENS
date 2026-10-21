'use strict';
// F-5 · Classificação de atraso/urgência — MESMA regra no servidor (server.js)
// e no navegador (patch.js). A tabela abaixo roda nos dois e precisa bater.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const server = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const patch = fs.readFileSync(path.join(ROOT, 'patch.js'), 'utf8');

function extrair(src, nome) {
  const i = src.indexOf('function ' + nome + '(');
  assert.ok(i >= 0, 'função não encontrada: ' + nome);
  const prefixo = src.slice(Math.max(0, i - 6), i) === 'async ' ? 'async ' : '';
  let d = 0;
  const j = src.indexOf('{', i);
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (d === 0) return prefixo + src.slice(i, k + 1); }
  }
  throw new Error('fim não achado: ' + nome);
}

// servidor
const sctx = { console, _SP_TZ: 'America/Sao_Paulo' };
vm.createContext(sctx);
vm.runInContext(
  [extrair(server, '_spAddDiaIso'), extrair(server, '_ofClassificaUrgencia')].join('\n'),
  sctx
);
const servidor = sctx._ofClassificaUrgencia;

// navegador
function extrairAtribuicao(src, marcador) {
  const i = src.indexOf(marcador);
  assert.ok(i >= 0, 'atribuição não encontrada: ' + marcador);
  const j = src.indexOf('{', i);
  let d = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (d === 0) return src.slice(i, k + 1) + ';'; }
  }
  throw new Error('fim não achado: ' + marcador);
}

const win = {};
const bctx = { window: win, console };
vm.createContext(bctx);
vm.runInContext(extrairAtribuicao(patch, 'window._ofClassificaUrgencia = function'), bctx);
const navegador = win._ofClassificaUrgencia;

// Objetos devolvidos pelos contextos vm têm outro protótipo (outro realm).
const plain = (v) => JSON.parse(JSON.stringify(v));
const srv = (of, hoje) => plain(servidor(of, hoje));
const nav = (of, hoje) => plain(navegador(of, hoje));

const HOJE = '2026-10-20';
const CASOS = [
  ['atrasada simples', { data_entrega: '2026-10-19' }, { urgente: false, atrasada: true, vence3: false }],
  ['vence hoje', { data_entrega: '2026-10-20' }, { urgente: false, atrasada: false, vence3: true }],
  ['vence no limite de 3 dias', { data_entrega: '2026-10-23' }, { urgente: false, atrasada: false, vence3: true }],
  ['fora da janela de 3 dias', { data_entrega: '2026-10-24' }, { urgente: false, atrasada: false, vence3: false }],
  ['flag urg', { urg: true, data_entrega: '2026-11-01' }, { urgente: true, atrasada: false, vence3: false }],
  ['flag urgente', { urgente: 1, data_entrega: '2026-10-19' }, { urgente: true, atrasada: true, vence3: false }],
  ['campo alternativo ent', { ent: '2026-10-19' }, { urgente: false, atrasada: true, vence3: false }],
  ['data com hora corta no slice', { data_entrega: '2026-10-19T12:00:00Z' }, { urgente: false, atrasada: true, vence3: false }],
  ['data inválida não classifica', { data_entrega: 'nao-e-data' }, { urgente: false, atrasada: false, vence3: false }],
  ['OF vazia', {}, { urgente: false, atrasada: false, vence3: false }],
];

for (const [nome, of, esperado] of CASOS) {
  test('F-5 servidor: ' + nome, () => {
    assert.deepStrictEqual(srv(of, HOJE), esperado);
  });
  test('F-5 navegador: ' + nome, () => {
    assert.deepStrictEqual(nav(of, HOJE), esperado);
  });
}

test('F-5: hojeIso inválido não marca atraso nem janela', () => {
  assert.deepStrictEqual(srv({ data_entrega: '2026-10-19' }, 'x'), { urgente: false, atrasada: false, vence3: false });
  assert.deepStrictEqual(nav({ data_entrega: '2026-10-19' }, 'x'), { urgente: false, atrasada: false, vence3: false });
});
