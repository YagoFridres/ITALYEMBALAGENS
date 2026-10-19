'use strict';

/**
 * Normalização de empresa para mutações de OF (P1 · OF Rápida).
 *
 * Funções PURAS (sem acesso a banco): recebem as linhas da tabela `empresas`
 * e devolvem `{ empresa_id, emp_id }` ou `{ erro }`.
 *
 * Motivação (causa raiz confirmada):
 *   O front enviava o CÓDIGO da empresa (`E1`/`E2`/`E3`) no campo `empresa_id`.
 *   O servidor aceitava sem validar e o `ofIn()` apagava o campo em silêncio,
 *   gravando a OF sem empresa. Aqui o código/sigla é traduzido para o UUID real.
 */

var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// UUID da Oestepack gravado com erro de digitação em alguns pontos do patch.js.
var UUID_OESTEPACK_ERRADO = 'a6e5f5d8-4743-4ebe-885e-c2f0f741a667';
var UUID_OESTEPACK_ERRADO_35 = 'a6e5f5d8-4743-4ebe-885e-c2f0741a667';
var UUID_OESTEPACK_CORRETO = 'a6e5f5d8-4743-4ebe-885e-c2f0741a667a';
var UUID_VARIANTES_QUEBRADAS = {};
UUID_VARIANTES_QUEBRADAS[UUID_OESTEPACK_ERRADO] = UUID_OESTEPACK_CORRETO;
UUID_VARIANTES_QUEBRADAS[UUID_OESTEPACK_ERRADO_35] = UUID_OESTEPACK_CORRETO;

// Código curto → sigla canônica da empresa.
var CODIGO_PARA_SIGLA = { E1: 'ITALY', E2: 'CARTO', E3: 'OESTE' };
var SIGLA_PARA_CODIGO = { ITALY: 'E1', CARTO: 'E2', OESTE: 'E3' };

// Mapa canônico usado quando a tabela `empresas` não está disponível.
var EMPRESAS_FALLBACK = [
  { id: 'df5f7672-0a6b-402d-ae65-296554236c31', sigla: 'ITALY', codigo: 'E1', nome: 'Italy Embalagens' },
  { id: 'e9b734dc-c7d5-4b04-898d-1ec7affa721e', sigla: 'CARTO', codigo: 'E2', nome: 'Cartoeste' },
  { id: 'a6e5f5d8-4743-4ebe-885e-c2f0741a667a', sigla: 'OESTE', codigo: 'E3', nome: 'Oestepack' },
];

function _txt(v) {
  return v == null ? '' : String(v).trim();
}

function _upper(v) {
  return _txt(v).toUpperCase();
}

function isUuid(v) {
  return UUID_RE.test(_txt(v));
}

// Corrige o UUID da Oestepack digitado errado em partes do front/servidor.
function corrigirUuid(v) {
  var raw = _txt(v);
  if (UUID_VARIANTES_QUEBRADAS[raw]) return UUID_VARIANTES_QUEBRADAS[raw];
  if (UUID_VARIANTES_QUEBRADAS[raw.toLowerCase()]) return UUID_VARIANTES_QUEBRADAS[raw.toLowerCase()];
  return raw;
}

// Reduz qualquer texto (sigla, nome, código) para a sigla canônica conhecida.
function _siglaCanonica(txt) {
  var u = _upper(txt);
  if (!u) return '';
  if (CODIGO_PARA_SIGLA[u]) return CODIGO_PARA_SIGLA[u];
  if (u.indexOf('ITALY') !== -1) return 'ITALY';
  if (u.indexOf('CARTO') !== -1) return 'CARTO';
  if (u.indexOf('OESTE') !== -1) return 'OESTE';
  return '';
}

function _codigoDaRow(row) {
  if (!row || typeof row !== 'object') return '';
  var codigo = _upper(row.codigo || row.cod || row.emp_id || row.empId);
  if (CODIGO_PARA_SIGLA[codigo]) return codigo;
  var sigla = _siglaCanonica(row.sigla || row.sigla_empresa || row.nome || row.empresa);
  if (SIGLA_PARA_CODIGO[sigla]) return SIGLA_PARA_CODIGO[sigla];
  return '';
}

function _indexar(empresasRows) {
  var porId = {};
  var porSigla = {};
  var porCodigo = {};
  var total = 0;
  (Array.isArray(empresasRows) ? empresasRows : []).forEach(function (row) {
    if (!row || typeof row !== 'object') return;
    var id = corrigirUuid(row.id);
    if (isUuid(id)) {
      porId[id.toLowerCase()] = row;
      total += 1;
    }
    var codigo = _upper(row.codigo || row.cod || row.emp_id || row.empId);
    if (codigo) porCodigo[codigo] = row;
    var sigla = _siglaCanonica(row.sigla || row.sigla_empresa || row.nome || row.empresa);
    if (sigla) porSigla[sigla] = row;
    if (codigo && CODIGO_PARA_SIGLA[codigo]) porSigla[CODIGO_PARA_SIGLA[codigo]] = row;
  });
  return { porId: porId, porSigla: porSigla, porCodigo: porCodigo, total: total };
}

/**
 * Resolve um token (UUID, código E1/E2/E3 ou sigla ITALY/CARTO/OESTE)
 * para a linha da empresa. Retorna null se vazio, { erro } se não resolver.
 */
function _resolverToken(token, idx) {
  var raw = _txt(token);
  if (!raw) return null;

  if (isUuid(raw)) {
    var fixo = corrigirUuid(raw);
    var key = fixo.toLowerCase();
    var row = idx.porId[key];
    if (row) return { empresa_id: corrigirUuid(row.id), emp_id: _codigoDaRow(row) };
    if (idx.total === 0) {
      // Tabela indisponível: aceita apenas UUID de empresa conhecida.
      var cod = '';
      (Object.keys(CODIGO_PARA_SIGLA)).forEach(function (c) {
        var u = EMPRESAS_FALLBACK.filter(function (f) { return f.codigo === c; })[0];
        if (u && u.id.toLowerCase() === key) cod = c;
      });
      if (cod) return { empresa_id: fixo, emp_id: cod };
      return { erro: 'uuid_nao_encontrado' };
    }
    return { erro: 'uuid_nao_encontrado' };
  }

  var upper = _upper(raw);
  var sigla = CODIGO_PARA_SIGLA[upper] || _siglaCanonica(upper);
  var row2 = null;
  if (sigla) row2 = idx.porSigla[sigla] || null;
  if (!row2 && idx.porCodigo[upper]) row2 = idx.porCodigo[upper];
  if (!row2 && idx.porSigla[upper]) row2 = idx.porSigla[upper];

  if (!row2 && idx.total === 0 && sigla) {
    // Tabela indisponível: usa o mapa canônico fixo.
    var fb = EMPRESAS_FALLBACK.filter(function (f) { return f.sigla === sigla; })[0];
    if (fb) return { empresa_id: fb.id, emp_id: fb.codigo };
  }
  if (!row2) return { erro: 'codigo_nao_encontrado' };
  return { empresa_id: corrigirUuid(row2.id), emp_id: _codigoDaRow(row2) };
}

/**
 * normalizarEmpresa({ empresa_id, emp_id }, empresasRows)
 *   → { empresa_id: <uuid>, emp_id: 'E1'|'E2'|'E3' }
 *   → { erro: <motivo> }
 *
 * Regras:
 *  - Aceita UUID válido presente em `empresas`, código E1/E2/E3 ou sigla ITALY/CARTO/OESTE.
 *  - Se `empresa_id` e `emp_id` apontarem para empresas diferentes → erro.
 *  - Sem nenhuma das duas → erro (`empresa_obrigatoria`).
 */
function normalizarEmpresa(input, empresasRows) {
  var src = input || {};
  var idx = _indexar(empresasRows);

  var temEmpresaId = _txt(src.empresa_id != null ? src.empresa_id : src.empresaId) !== '';
  var temEmpId = _txt(src.emp_id != null ? src.emp_id : src.empId) !== '';

  if (!temEmpresaId && !temEmpId) return { erro: 'empresa_obrigatoria' };

  var a = _resolverToken(src.empresa_id != null ? src.empresa_id : src.empresaId, idx);
  var b = _resolverToken(src.emp_id != null ? src.emp_id : src.empId, idx);

  if (a && b && !a.erro && !b.erro) {
    if (String(a.empresa_id).toLowerCase() !== String(b.empresa_id).toLowerCase()) {
      return { erro: 'conflito_empresa' };
    }
    return { empresa_id: a.empresa_id, emp_id: a.emp_id || b.emp_id };
  }

  var ok = (a && !a.erro) ? a : ((b && !b.erro) ? b : null);
  if (!ok) return { erro: 'empresa_invalida' };
  return { empresa_id: ok.empresa_id, emp_id: ok.emp_id };
}

module.exports = {
  UUID_RE: UUID_RE,
  UUID_OESTEPACK_ERRADO: UUID_OESTEPACK_ERRADO,
  UUID_OESTEPACK_CORRETO: UUID_OESTEPACK_CORRETO,
  CODIGO_PARA_SIGLA: CODIGO_PARA_SIGLA,
  SIGLA_PARA_CODIGO: SIGLA_PARA_CODIGO,
  EMPRESAS_FALLBACK: EMPRESAS_FALLBACK,
  isUuid: isUuid,
  corrigirUuid: corrigirUuid,
  normalizarEmpresa: normalizarEmpresa,
};
