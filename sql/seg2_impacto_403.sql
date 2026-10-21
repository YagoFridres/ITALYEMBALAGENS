-- SEG-2 · IMPACTO DE PERMISSÃO · SOMENTE LEITURA (nenhum dado é alterado)
--
-- Objetivo: ANTES de aplicar o SEG-2, mostrar ao Yago, por usuário, em quais
-- grupos de rota o acesso passará a responder 403, segundo as permissões ATUAIS
-- no banco. Colar o resultado no PR. NÃO altera permissões de ninguém.
--
-- Como rodar: Supabase -> SQL Editor -> cole e execute.
--
-- Grupos do SEG-2 (permissão exigida):
--   comissoes  -> /api/comissoes*
--   financeiro -> /api/central-custos*, /api/centros-custo*, /api/relatorios/custos,
--                 /api/relatorios/lucratividade-por-maquina   (permissão NOVA)
--   relatorios -> /api/relatorios/vendas-por-empresa, comparativo-mensal, evolucao-vendas,
--                 vendas-por-ramo, vendas-por-cidade-estado, controle-vendas-vendedor,
--                 clientes-mais-compraram, projecao-vendas, resumo-anual, ofs-entradas-mes,
--                 cliente-ficha, /api/relatorio/*,
--                 /api/relatorios/producao*, /api/relatorios/aparras*
--   dashboard  -> /api/dashboard/total-geral, faturamento-mensal, faturamento-manual
--   orcamentos -> /api/orcamentos*, /api/orcamentos_pastas*
--
-- Regra do SEG-2: admin (perfil 'admin' ou permissão 'tudo') passa sempre e não
-- perde nenhum grupo.

WITH base AS (
  SELECT
    id,
    COALESCE(NULLIF(nome, ''), email, id::text) AS usuario,
    LOWER(TRIM(COALESCE(perfil, '')))            AS perfil,
    COALESCE(ativo, true)                         AS ativo,
    CASE
      WHEN permissoes IS NULL                             THEN '[]'::jsonb
      WHEN jsonb_typeof(to_jsonb(permissoes)) = 'array'   THEN to_jsonb(permissoes)
      WHEN jsonb_typeof(to_jsonb(permissoes)) = 'string'  THEN COALESCE((to_jsonb(permissoes) #>> '{}')::jsonb, '[]'::jsonb)
      ELSE '[]'::jsonb
    END                                           AS perms
  FROM usuarios
),
aval AS (
  SELECT
    usuario, perfil, ativo, perms::text AS permissoes,
    (perfil LIKE '%admin%' OR perms ? 'tudo')                          AS admin,
    (perfil LIKE '%admin%' OR perms ? 'tudo' OR perms ? 'comissoes')   AS pode_comissoes,
    (perfil LIKE '%admin%' OR perms ? 'tudo' OR perms ? 'financeiro')  AS pode_financeiro,
    (perfil LIKE '%admin%' OR perms ? 'tudo' OR perms ? 'relatorios')  AS pode_relatorios,
    (perfil LIKE '%admin%' OR perms ? 'tudo' OR perms ? 'dashboard')   AS pode_dashboard,
    (perfil LIKE '%admin%' OR perms ? 'tudo' OR perms ? 'orcamentos')  AS pode_orcamentos
  FROM base
)
SELECT
  usuario,
  perfil,
  ativo,
  permissoes,
  admin,
  CASE WHEN pode_comissoes  THEN 'ok' ELSE '403 (comissoes)'  END AS comissoes,
  CASE WHEN pode_financeiro THEN 'ok' ELSE '403 (financeiro)' END AS financeiro,
  CASE WHEN pode_relatorios THEN 'ok' ELSE '403 (relatorios)' END AS relatorios,
  CASE WHEN pode_dashboard  THEN 'ok' ELSE '403 (dashboard)'  END AS dashboard,
  CASE WHEN pode_orcamentos THEN 'ok' ELSE '403 (orcamentos)' END AS orcamentos
FROM aval
ORDER BY admin DESC, usuario;
