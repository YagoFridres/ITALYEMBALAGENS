-- ============================================================================
-- D5a_ped_fornecedor_item.sql  ·  item CP-02  ·  "Pedido do fornecedor" de cada
-- item da compra de papelão nunca é salvo
-- ----------------------------------------------------------------------------
-- NÃO EXECUTAR. Este arquivo é apenas a PROPOSTA de correção de schema, com o
-- SELECT de conferência e o ROLLBACK explícito (nada é gravado).
--
-- Contexto (prompt CP-02, linhas 739-746):
--   O campo "Pedido <fornecedor>" do ITEM da compra é enviado pelo front
--   (`ped_fornecedor` / `pedido_fornecedor`, patch.js ~8929) e o servidor
--   monta o item em `_comprasChapasBuildItemPayload` (server.js ~29894), mas a
--   coluna NÃO existe em `compras_chapas_itens` — então o valor some no insert
--   (o retry de coluna inexistente descarta o campo).
--
--   Esta migração cria a coluna. A gravação/leitura/impressão do campo é a
--   correção de CÓDIGO do CP-02 (`_comprasChapasBuildItemPayload` deve gravar
--   `ped_fornecedor` e parar de mandar `pedido_fornecedor`).
--
--   DECISÃO PENDENTE C1 (prompt linha 1171): "Manter o pedido do fornecedor por
--   item?" — se a resposta for NÃO, este arquivo é descartado. Aprovar antes.
--
-- Números esperados:
--   PASSO 1 · coluna `ped_fornecedor` em `compras_chapas_itens` ..... 0 linhas
--   PASSO 3 · após o ALTER ......................................... 1 linha
-- ============================================================================


-- ---------------------------------------------------------------------------
-- PASSO 1 · Conferência · a coluna já existe? (esperado: 0 linhas)
-- ---------------------------------------------------------------------------
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'compras_chapas_itens'
  AND column_name = 'ped_fornecedor';


-- ---------------------------------------------------------------------------
-- PASSO 2 · PROPOSTA de ajuste (transação com ROLLBACK — não grava nada)
--           Coluna anulável: o campo é opcional no item.
-- ---------------------------------------------------------------------------
BEGIN;

ALTER TABLE public.compras_chapas_itens
  ADD COLUMN IF NOT EXISTS ped_fornecedor text;

-- PASSO 3 · Conferência pós-ALTER (esperado: 1 linha)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'compras_chapas_itens'
  AND column_name = 'ped_fornecedor';

ROLLBACK;


-- ---------------------------------------------------------------------------
-- PASSO 4 · Como aplicar (fora deste arquivo, após a aprovação)
--   1) aprovar a DECISÃO C1 (manter o campo por item);
--   2) aplicar a coluna em produção (fora de transação);
--   3) subir o código do CP-02 no mesmo deploy, senão o campo continua sendo
--      descartado pelo retry de coluna inexistente.
--   Em produção, até a aprovação, registrar que o campo continua sumindo.
-- ---------------------------------------------------------------------------
