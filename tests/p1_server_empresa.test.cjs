'use strict';
// P1 · Empresa obrigatória nas OFs criadas FORA do POST /api/ofs
//   (Pedidos Recorrentes e Jarvis). Dados fictícios, sem banco.
//
// Dois níveis:
//  1) funcional: `normalizarEmpresa({ emp_id })` — é exatamente o que as duas
//     rotas passam agora. Um código inválido precisa devolver `erro` (é esse
//     erro que faz a rota NÃO inserir a OF).
//  2) estático: as duas rotas em server.js preenchem `filtered.empresa_id`
//     (UUID) ANTES de `ofsInsertWithRetry(ofIn(filtered))`.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { normalizarEmpresa, UUID_OESTEPACK_CORRETO } = require('../lib/empresa.js');

const ITALY = 'df5f7672-0a6b-402d-ae65-296554236c31';
const CARTO = 'e9b734dc-c7d5-4b04-898d-1ec7affa721e';
const OESTE = UUID_OESTEPACK_CORRETO;

const EMPRESAS_ROWS = [
  { id: ITALY, nome: 'Italy Embalagens', sigla: 'ITALY', codigo: 'E1' },
  { id: CARTO, nome: 'Cartoeste', sigla: 'CARTO', codigo: 'E2' },
  { id: OESTE, nome: 'Oestepack', sigla: 'OESTE', codigo: 'E3' },
];

const SERVER_SRC = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

function blocoDe(nomeFuncao, tamanho) {
  const i = SERVER_SRC.indexOf(nomeFuncao);
  assert.ok(i >= 0, 'não achei ' + nomeFuncao + ' em server.js');
  return SERVER_SRC.slice(i, i + tamanho);
}

test('normalizarEmpresa({ emp_id: E1/E2/E3 }) resolve para o UUID (caminho das rotas)', () => {
  assert.equal(normalizarEmpresa({ emp_id: 'E1' }, EMPRESAS_ROWS).empresa_id, ITALY);
  assert.equal(normalizarEmpresa({ emp_id: 'E2' }, EMPRESAS_ROWS).empresa_id, CARTO);
  assert.equal(normalizarEmpresa({ emp_id: 'E3' }, EMPRESAS_ROWS).empresa_id, OESTE);
});

test('normalizarEmpresa({ emp_id }) com código inválido devolve erro (rota NÃO insere)', () => {
  const r = normalizarEmpresa({ emp_id: 'E9' }, EMPRESAS_ROWS);
  assert.ok(r && r.erro, 'código inválido deveria retornar erro');
  assert.equal(r.empresa_id, undefined);
});

test('normalizarEmpresa({ emp_id }) vazio devolve empresa_obrigatoria', () => {
  const r = normalizarEmpresa({ emp_id: '' }, EMPRESAS_ROWS);
  assert.equal(r.erro, 'empresa_obrigatoria');
});

test('recorrente: preenche empresa_id (UUID) antes do ofIn e não insere se não resolver', () => {
  const bloco = blocoDe('async function _gerarRecorrenteSePrecisa', 6000);
  const iNorm = bloco.indexOf('normalizarEmpresa({ emp_id: empId }');
  const iSet = bloco.indexOf('filtered.empresa_id = empNormR.empresa_id');
  const iInsert = bloco.indexOf('ofsInsertWithRetry(ofIn(filtered))');
  assert.ok(iNorm >= 0, 'faltou normalizarEmpresa no recorrente');
  assert.ok(iSet >= 0, 'faltou preencher filtered.empresa_id no recorrente');
  assert.ok(iInsert >= 0, 'faltou o insert no recorrente');
  assert.ok(iNorm < iInsert && iSet < iInsert, 'empresa_id deve ser preenchido ANTES do insert');
  assert.ok(bloco.indexOf("skipped:'empresa_nao_resolvida'") >= 0, 'faltou o não-insere (empresa_nao_resolvida)');
});

test('jarvis: preenche empresa_id (UUID) antes do ofIn e não insere se não resolver', () => {
  const bloco = blocoDe('async function _pedidoLinguagemNaturalProcess', 8000);
  const iNorm = bloco.indexOf('normalizarEmpresa({ emp_id: payload.emp_id }');
  const iSet = bloco.indexOf('filtered.empresa_id = empNormJ.empresa_id');
  const iInsert = bloco.indexOf('ofsInsertWithRetry(ofIn(filtered))');
  assert.ok(iNorm >= 0, 'faltou normalizarEmpresa no Jarvis');
  assert.ok(iSet >= 0, 'faltou preencher filtered.empresa_id no Jarvis');
  assert.ok(iInsert >= 0, 'faltou o insert no Jarvis');
  assert.ok(iNorm < iInsert && iSet < iInsert, 'empresa_id deve ser preenchido ANTES do insert');
  assert.ok(bloco.indexOf("'empresa_obrigatoria'") >= 0, 'faltou o erro empresa_obrigatoria no Jarvis');
});
