-- ============================================================================
-- D5c_flags_manuais.sql  ·  item CP-01 (OPCIONAL)  ·  Área e total digitados à
-- mão voltam ao valor calculado
-- ----------------------------------------------------------------------------
-- NÃO EXECUTAR. Este arquivo é apenas a PROPOSTA de correção de schema, com o
-- SELECT de conferência e o ROLLBACK explícito (nada é gravado).
--
-- Contexto (prompt CP-01, linhas 732-737):
--   Na tela da compra de papelão, M² e Valor Total digitados à mão voltam ao
--   valor calculado ao reabrir e salvar (330 / R$ 1.400,00 viram 324 /
--   R$ 1.328,40). O servidor (`_comprasChapasBuildItemPayload`, server.js
--   ~29894) já respeita as flags `area_manual` e `total_manual` QUANDO o front
--   as envia, mas elas não são persistidas — reabrir o item perde a marcação.
--
--   O prompt marca esta migração como OPCIONAL ("Opcional: migração
--   D5c_flags_manuais.sql com area_manual e total_manual boolean"). A correção
--   principal do CP-01 é de CÓDIGO (marcar `data-ccpx-manual="1"` no item que
--   vem do banco quando `|area_m2 − L×C/1e6×qtd| > 0,0001` e quando
--   `|valor_total − area_m2×valor_m2| > 0,005`).
--
--   Se o código passar a deduzir a marcação pelo próprio valor (como descrito
--   acima), esta coluna é dispensável. Manter apenas se quiser guardar a
--   intenção do usuário sem depender do epsilon.
--
-- Números esperados:
--   PASSO 1 · colunas presentes em `compras_chapas_itens` .......... 0 linhas
--   PASSO 3 · após os ALTERs ..................................... 2 linhas
-- ============================================================================


-- ---------------------------------------------------------------------------
-- PASSO 1 · Conferência · colunas já existem? (esperado: 0 linhas)
-- ---------------------------------------------------------------------------
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'compras_chapas_itens'
  AND column_name IN ('area_manual','total_manual')
ORDER BY column_name;


-- ---------------------------------------------------------------------------
-- PASSO 2 · PROPOSTA de ajuste (transação com ROLLBACK — não grava nada)
--           Boolean anulável + default false: itens antigos ficam como
--           "não manual" (recalcula), que é o comportamento de hoje.
-- ---------------------------------------------------------------------------
BEGIN;

ALTER TABLE public.compras_chapas_itens
  ADD COLUMN IF NOT EXISTS area_manual boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS total_manual boolean DEFAULT false;

-- PASSO 3 · Conferência pós-ALTER (esperado: 2 linhas)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'compras_chapas_itens'
  AND column_name IN ('area_manual','total_manual')
ORDER BY column_name;

ROLLBACK;


-- ---------------------------------------------------------------------------
-- PASSO 4 · Como aplicar (fora deste arquivo, APÓS a aprovação)
--   1) confirmar que a correção de CÓDIGO do CP-01 NÃO deduz a marcação pelo
--      epsilon (se deduzir, não aplicar esta migração);
--   2) aplicar as colunas em produção;
--   3) subir o código que grava as flags no item (hoje
--      `_comprasChapasBuildItemPayload` faz `delete item.area_manual/total_manual`,
--      server.js ~29910-29911 — precisa mudar ANTES de a coluna ter efeito).
-- ---------------------------------------------------------------------------
