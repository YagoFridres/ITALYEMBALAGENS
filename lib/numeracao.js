'use strict';

/**
 * Numeração segura de OF (P1 · OF Rápida).
 *
 * Funções PURAS (sem acesso a banco). Recebem as linhas da tabela `ofs` já
 * lidas e devolvem o próximo número livre. O banco tem UNIQUE(ofs.numero)
 * GLOBAL, então o próximo número é sempre o maior número existente (em
 * qualquer coluna de negócio) + 1, sem filtrar por empresa.
 */

// Colunas de negócio que podem guardar o número visível da OF.
var CAMPOS_NEGOCIO = ['numero', 'of_num', 'of_seq', 'of', 'seq'];

function _toInt(v) {
  if (v === null || v === undefined || v === '') return null;
  var n = parseInt(String(v).replace(/\D/g, ''), 10);
  return isNaN(n) ? null : n;
}

// Maior número encontrado nas linhas, considerando os campos informados.
function extrairMaximo(rows, campos) {
  var cols = Array.isArray(campos) ? campos : CAMPOS_NEGOCIO;
  var maior = 0;
  (Array.isArray(rows) ? rows : []).forEach(function (o) {
    if (!o || typeof o !== 'object') return;
    cols.forEach(function (c) {
      var n = _toInt(o[c]);
      if (n !== null && n > maior) maior = n;
    });
  });
  return maior;
}

// Conjunto (mapa) de todos os números já usados, para checagem O(1).
function coletarTomados(rows, campos) {
  var cols = Array.isArray(campos) ? campos : CAMPOS_NEGOCIO;
  var set = Object.create(null);
  (Array.isArray(rows) ? rows : []).forEach(function (o) {
    if (!o || typeof o !== 'object') return;
    cols.forEach(function (c) {
      var n = _toInt(o[c]);
      if (n !== null) set[n] = true;
    });
  });
  return set;
}

// Próximo número livre a partir de `base`, pulando os já tomados.
// Retorna string (formato gravado no banco) ou null se não houver base válida.
function proximoNumeroLivre(base, tomados) {
  var b = Math.trunc(Number(base) || 0);
  if (b <= 0) return null;
  for (var i = 0; i < 100000; i += 1) {
    var cand = b + i;
    if (!tomados || !tomados[cand]) return String(cand);
  }
  return null;
}

module.exports = {
  CAMPOS_NEGOCIO: CAMPOS_NEGOCIO,
  extrairMaximo: extrairMaximo,
  coletarTomados: coletarTomados,
  proximoNumeroLivre: proximoNumeroLivre,
};
