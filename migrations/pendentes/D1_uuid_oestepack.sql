-- ============================================================================
-- D1_uuid_oestepack.sql  ·  item REL-01  ·  "Oestepack perde OFs por UUID errado"
-- ----------------------------------------------------------------------------
-- NÃO EXECUTAR. Este arquivo é apenas a PROPOSTA de correção de dados, com os
-- SELECTs de conferência e o ROLLBACK explícito (nada é gravado).
--
-- Contexto (prompt REL-01):
--   Parte das OFs foi gravada com VARIANTES QUEBRADAS do UUID da Oestepack.
--   O UUID correto (tabela `empresas`) é:
--     a6e5f5d8-4743-4ebe-885e-c2f0741a667a
--   Variantes quebradas conhecidas (lib/empresa.js · UUID_VARIANTES_QUEBRADAS):
--     a6e5f5d8-4743-4ebe-885e-c2f0f741a667   (troca de "0741a" por "0f741")
--     a6e5f5d8-4743-4ebe-885e-c2f0741a667    (sem o "a" final)
--     a6e5f5d8-4743-4ebe-885e-c2f0f741a667a  (com "0f741" E "a" final)
--
--   Efeito: relatórios de vendas por empresa descartavam essas OFs
--   (setembro mostrava 713 OFs / R$ 960.893,73; real 749 / R$ 1.040.508,33;
--    Oestepack mostrava R$ 3.714,76; real R$ 83.329,36).
--
--   A correção de CÓDIGO (F-3 em `_relatoriosPickEmpresaId`/`_empresaDaOf` e
--   `_jj3ClassificaEmpresa`) já faz essas OFs contarem como Oestepack sem
--   mexer no banco. Este arquivo corrige o DADO para não deixar resíduo.
--
-- Números esperados (conferir no PASSO 1 antes de qualquer coisa):
--   PASSO 1 (todas as variantes quebradas) ............ 39 linhas
--   PASSO 3 (somente as com emp_id = 'E3') ............ 36 linhas  <- UPDATE
--   PASSO 6 (somente as com emp_id = 'E1') ............  3 linhas  <- decisão
-- ============================================================================


-- ---------------------------------------------------------------------------
-- PASSO 1 · Conferência · todas as OFs com variante quebrada (esperado: 39)
--           (comparação por texto para não depender do tipo uuid)
-- ---------------------------------------------------------------------------
SELECT
  o.id,
  o.numero,
  o.status,
  o.empresa_id::text AS empresa_id_atual,
  o.emp_id,
  o.dia,
  o.created_at,
  o.deleted_at
FROM ofs o
WHERE o.empresa_id::text IN (
    'a6e5f5d8-4743-4ebe-885e-c2f0f741a667',
    'a6e5f5d8-4743-4ebe-885e-c2f0741a667',
    'a6e5f5d8-4743-4ebe-885e-c2f0f741a667a'
  )
ORDER BY o.emp_id, o.numero::text;


-- ---------------------------------------------------------------------------
-- PASSO 2 · Conferência · quebra por variante e por emp_id
-- ---------------------------------------------------------------------------
SELECT
  o.empresa_id::text AS variante_quebrada,
  o.emp_id,
  count(*) AS qtd
FROM ofs o
WHERE o.empresa_id::text IN (
    'a6e5f5d8-4743-4ebe-885e-c2f0f741a667',
    'a6e5f5d8-4743-4ebe-885e-c2f0741a667',
    'a6e5f5d8-4743-4ebe-885e-c2f0f741a667a'
  )
GROUP BY 1, 2
ORDER BY 2, 1;


-- ---------------------------------------------------------------------------
-- PASSO 3 · Conferência · somente as OFs a corrigir (emp_id = 'E3') (36 linhas)
-- ---------------------------------------------------------------------------
SELECT o.id, o.numero, o.status, o.empresa_id::text, o.emp_id
FROM ofs o
WHERE o.empresa_id::text IN (
    'a6e5f5d8-4743-4ebe-885e-c2f0f741a667',
    'a6e5f5d8-4743-4ebe-885e-c2f0741a667',
    'a6e5f5d8-4743-4ebe-885e-c2f0f741a667a'
  )
  AND o.emp_id = 'E3'
ORDER BY o.numero::text;


-- ---------------------------------------------------------------------------
-- PASSO 4 · PROPOSTA de ajuste (transação com ROLLBACK — não grava nada)
--           Troca a variante quebrada pelo UUID REAL da Oestepack, SOMENTE nas
--           OFs cujo emp_id já é 'E3' (as 3 com emp_id = 'E1' ficam de fora).
--           Não toca em status, valores, numeração, estoque ou comissão.
-- ---------------------------------------------------------------------------
BEGIN;

UPDATE ofs o
SET
  empresa_id = 'a6e5f5d8-4743-4ebe-885e-c2f0741a667a',
  updated_at = now()
WHERE o.empresa_id::text IN (
    'a6e5f5d8-4743-4ebe-885e-c2f0f741a667',
    'a6e5f5d8-4743-4ebe-885e-c2f0741a667',
    'a6e5f5d8-4743-4ebe-885e-c2f0f741a667a'
  )
  AND o.emp_id = 'E3';
-- Esperado: UPDATE 36

-- PASSO 5 · Conferência pós-UPDATE (esperado: 3 linhas, todas emp_id = 'E1')
SELECT o.id, o.numero, o.empresa_id::text, o.emp_id
FROM ofs o
WHERE o.empresa_id::text IN (
    'a6e5f5d8-4743-4ebe-885e-c2f0f741a667',
    'a6e5f5d8-4743-4ebe-885e-c2f0741a667',
    'a6e5f5d8-4743-4ebe-885e-c2f0f741a667a'
  )
ORDER BY o.emp_id, o.numero::text;

ROLLBACK;


-- ---------------------------------------------------------------------------
-- PASSO 6 · Decisão · as OFs que continuam na variante quebrada (emp_id != 'E3')
--           Esperado: 3 linhas, todas com emp_id = 'E1'. NÃO corrigir sem o
--           aval do Yago: o emp_id aponta para a Italy e o UUID para a Oestepack
--           (divergência de origem) — precisa saber a qual empresa pertencem.
-- ---------------------------------------------------------------------------
SELECT o.id, o.numero, o.status, o.empresa_id::text, o.emp_id, o.clinome, o.dia
FROM ofs o
WHERE o.empresa_id::text IN (
    'a6e5f5d8-4743-4ebe-885e-c2f0f741a667',
    'a6e5f5d8-4743-4ebe-885e-c2f0741a667',
    'a6e5f5d8-4743-4ebe-885e-c2f0f741a667a'
  )
  AND o.emp_id IS DISTINCT FROM 'E3'
ORDER BY o.numero::text;


-- ---------------------------------------------------------------------------
-- PASSO 7 · Conferência final · distribuição de OFs por empresa
--           (usar como referência do "antes x depois" dos relatórios)
-- ---------------------------------------------------------------------------
SELECT o.empresa_id::text, o.emp_id, count(*) AS qtd
FROM ofs o
WHERE o.deleted_at IS NULL
GROUP BY 1, 2
ORDER BY 3 DESC;
