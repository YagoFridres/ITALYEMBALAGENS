-- ============================================================================
-- D6_rls_orcamentos_versoes.sql  ·  item SEG-11  ·  `orcamentos_versoes` sem RLS
-- ----------------------------------------------------------------------------
-- NÃO EXECUTAR. Este arquivo é apenas a PROPOSTA de correção de schema, com o
-- SELECT de conferência e o ROLLBACK explícito (nada é gravado).
--
-- Contexto (prompt SEG-11, linhas 1148-1149):
--   A tabela `orcamentos_versoes` (snapshot histórico das versões do orçamento,
--   schema em server.js ~21690) está acessível pela API pública do Supabase
--   porque a RLS não está ligada. O prompt pede:
--     "migração D6_rls_orcamentos_versoes.sql (ALTER TABLE … ENABLE ROW LEVEL
--      SECURITY), sem executar."
--
--   Por que ligar é seguro para o app:
--     - o servidor Node acessa o Supabase com `SUPABASE_SERVICE_ROLE_KEY`
--       (service_role IGNORA a RLS) — project_memory: "o front-end NÃO acessa
--       Supabase diretamente";
--     - todas as escritas/leituras de versão passam por rotas do servidor
--       (server.js ~20550, 20646, 20879-20921) autenticadas por `authMiddleware`.
--
--   ATENÇÃO: com a RLS ligada e SEM policies, qualquer acesso por `anon`/
--   `authenticated` passa a ser negado. Como o front não usa a chave anon
--   nesta tabela, o efeito esperado é só fechar o buraco. Se algum cliente
--   externo ler por anon, será preciso criar uma policy — por isso o PASSO 4
--   manda conferir as policies ANTES de aplicar em produção.
--
-- Números esperados:
--   PASSO 1 · `relrowsecurity` de `orcamentos_versoes` .............. false
--   PASSO 3 · após o ALTER .......................................... true
-- ============================================================================


-- ---------------------------------------------------------------------------
-- PASSO 1 · Conferência · a RLS está ligada? (esperado: relrowsecurity = false)
-- ---------------------------------------------------------------------------
SELECT
  c.relname            AS tabela,
  c.relrowsecurity     AS rls_ligada,
  c.relforcerowsecurity AS rls_forcada,
  pg_get_userbyid(c.relowner) AS dono
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'orcamentos_versoes';


-- ---------------------------------------------------------------------------
-- PASSO 2 · Conferência · policies existentes hoje (esperado: 0 linhas)
--           Com a RLS ligada e 0 policies, só o service_role acessa.
-- ---------------------------------------------------------------------------
SELECT policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'orcamentos_versoes';


-- ---------------------------------------------------------------------------
-- PASSO 3 · PROPOSTA de ajuste (transação com ROLLBACK — não grava nada)
--           ALTER TABLE ... ENABLE ROW LEVEL SECURITY é DDL transacional no
--           Postgres, então o ROLLBACK desfaz tudo.
-- ---------------------------------------------------------------------------
BEGIN;

ALTER TABLE public.orcamentos_versoes ENABLE ROW LEVEL SECURITY;

-- PASSO 3.1 · Conferência pós-ALTER (esperado: rls_ligada = true)
SELECT
  c.relname        AS tabela,
  c.relrowsecurity AS rls_ligada
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'orcamentos_versoes';

ROLLBACK;


-- ---------------------------------------------------------------------------
-- PASSO 4 · Como aplicar (fora deste arquivo, APÓS a aprovação)
--   1) confirmar que NENHUMA tela lê `orcamentos_versoes` pela chave anon
--      (grep por 'orcamentos_versoes' no index.html/patch.js só deve aparecer
--      em chamadas às rotas /api/... do próprio servidor);
--   2) aplicar em produção;
--   3) validar: abrir um orçamento, salvar (cria versão) e listar versões —
--      tudo deve continuar 200 pelo servidor; um GET anon direto na tabela
--      deve passar a voltar vazio/negado.
-- ---------------------------------------------------------------------------
