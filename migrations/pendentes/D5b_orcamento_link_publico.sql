-- ============================================================================
-- D5b_orcamento_link_publico.sql  ·  item ORC-10  ·  Link público de aprovação
-- ----------------------------------------------------------------------------
-- NÃO EXECUTAR. Este arquivo é apenas a PROPOSTA de correção de schema, com o
-- SELECT de conferência e o ROLLBACK explícito (nada é gravado).
--
-- Contexto (prompt ORC-10, linhas 983-985):
--   O link público de aprovação do orçamento está BLOQUEADO até a DECISÃO O7
--   (prompt linha 1168): "Manter ou remover o link público de aprovação".
--
--   O código ATUAL já usa as colunas em `orcamentos`:
--     - `public_token` .................. server.js ~20528, 20856-20870
--     - `public_aprovacao` .............. server.js ~21010
--     - `public_aprovacao_em` ........... server.js ~21011
--     - `public_aprovacao_obs` .......... server.js ~21012
--   Nos pontos de escrita há retry que descarta a coluna inexistente, então
--   hoje o link "funciona" pela metade (o token some ao reler a linha).
--
--   POR ORDEM DO PROMPT: preparar SÓ a migração. NÃO mexer em rotas.
--
-- Números esperados (as 4 colunas devem voltar da conferência):
--   PASSO 1 · colunas presentes em `orcamentos` ................... 0 linhas
--   PASSO 3 · após os ALTERs ..................................... 4 linhas
-- ============================================================================


-- ---------------------------------------------------------------------------
-- PASSO 1 · Conferência · quais das 4 colunas já existem (esperado: 0 linhas)
-- ---------------------------------------------------------------------------
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'orcamentos'
  AND column_name IN (
    'public_token','public_aprovacao','public_aprovacao_em','public_aprovacao_obs'
  )
ORDER BY column_name;


-- ---------------------------------------------------------------------------
-- PASSO 2 · PROPOSTA de ajuste (transação com ROLLBACK — não grava nada)
--           `public_token` é um hex de 24 bytes (crypto.randomBytes(24)) gerado
--           pelo servidor; as demais guardam a resposta do cliente no link.
-- ---------------------------------------------------------------------------
BEGIN;

ALTER TABLE public.orcamentos
  ADD COLUMN IF NOT EXISTS public_token text,
  ADD COLUMN IF NOT EXISTS public_aprovacao text,
  ADD COLUMN IF NOT EXISTS public_aprovacao_em timestamptz,
  ADD COLUMN IF NOT EXISTS public_aprovacao_obs text;

-- PASSO 3 · Conferência pós-ALTER (esperado: 4 linhas)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'orcamentos'
  AND column_name IN (
    'public_token','public_aprovacao','public_aprovacao_em','public_aprovacao_obs'
  )
ORDER BY column_name;

ROLLBACK;


-- ---------------------------------------------------------------------------
-- PASSO 4 · Como decidir (fora deste arquivo)
--   - Se a DECISÃO O7 for MANTER: aplicar as colunas E depois subir o código do
--     link público (fora do escopo deste arquivo — o prompt proíbe mexer em
--     rotas agora).
--   - Se for REMOVER: descartar este arquivo e remover o código do link depois.
--   Não criar índice/constraint de unicidade agora: as rotas atuais buscam por
--   `id` e comparam o token em memória (server.js ~21001-21005), sem depender
--   de unicidade no banco.
-- ---------------------------------------------------------------------------
