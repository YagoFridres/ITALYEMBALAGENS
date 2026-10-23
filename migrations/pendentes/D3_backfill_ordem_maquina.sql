-- ============================================================================
-- D3_backfill_ordem_maquina.sql  ·  item OFMAQ-07  ·  "Priorizar/Adiar" não
-- troca de posição e 355 de 397 abertas estão com ordem_maquina = 0
-- ----------------------------------------------------------------------------
-- NÃO EXECUTAR. Este arquivo é apenas a PROPOSTA de correção de dados, com os
-- SELECTs de conferência e o ROLLBACK explícito (nada é gravado).
--
-- Contexto (prompt OFMAQ-07, linhas 832-842):
--   O Priorizar/Adiar do Dashboard fazia `Math.max(0, ordemAtual + delta)` (só
--   ±1, sem trocar com a vizinha) e ainda enviava `seq`, que o PATCH descarta.
--   Com isso 355 das 397 OFs abertas ficaram com `ordem_maquina = 0`, e a fila
--   do OFMAQ cai no desempate (urgência -> data de entrega -> número).
--
--   A correção de CÓDIGO (chamar `reorderWithinDay` com 2 PATCH `{ordem_maquina}`,
--   sem `seq`, numerando a máquina+dia na primeira troca) já resolve o caso
--   novo. Este arquivo só faz o BACKFILL da ordem das abertas que continuam
--   com 0, para a fila exibida no OFMAQ ficar explícita no banco.
--
--   Única ordem considerada: `ordem_maquina`. Não tocar em `seq`, `maq`,
--   `maquina_atual`, `prioridade_producao` nem em qualquer outra regra de
--   ordenação (prompt: "não mudar outras regras de ordenação").
--
-- Números esperados (conferir no PASSO 1 antes de qualquer coisa):
--   Total de abertas na fila do OFMAQ (não concluídas/canceladas, não passadas,
--   não deletadas) .................................. 397 linhas
--   Abertas com `ordem_maquina = 0` .................. 355 linhas   <- BACKFILL
--
-- ATENÇÃO à chave "máquina + dia":
--   O app resolve a máquina com `resolveMachine` (patch.js ~27052) e o dia com
--   `resolveDisplayDate` (patch.js ~27088). O SQL abaixo aproxima a chave por
--   `maquina_agendada -> maquina` e
--   `dia_programacao -> data_producao -> dia`; a etapa ATUAL do fluxo
--   (`fluxo_maquinas[maquina_atual_index]`) tem PRIORIDADE no app, mas fica de
--   fora deste SQL. O PASSO 6 lista as OFs em que a chave SQL ficaria vazia e o
--   PASSO 2 mostra as partições em risco — confira ANTES de rodar o PASSO 5.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- PASSO 1 · Conferência · total da fila e quantas estão com ordem_maquina = 0
--           (esperado: 397 na primeira linha, 355 na segunda)
-- ---------------------------------------------------------------------------
SELECT
  count(*) AS abertas_ofmaq,
  count(*) FILTER (WHERE COALESCE(o.ordem_maquina, 0) = 0) AS abertas_sem_ordem
FROM ofs o
WHERE o.deleted_at IS NULL
  AND COALESCE(o.passou_maquina, false) = false
  AND COALESCE(o.status, '') NOT ILIKE '%conclu%'
  AND COALESCE(o.status, '') NOT ILIKE '%cancel%';


-- ---------------------------------------------------------------------------
-- PASSO 2 · Conferência · partições (máquina + dia) que misturam OFs numeradas
--           com OFs em 0 (risco de colisão). Se voltar linha, o PASSO 5
--           renumera a PARTIÇÃO inteira 1..N para não duplicar ordem.
-- ---------------------------------------------------------------------------
WITH base AS (
  SELECT
    o.id,
    COALESCE(NULLIF(BTRIM(o.maquina_agendada), ''), NULLIF(BTRIM(o.maquina), '')) AS maq_key,
    COALESCE(
      NULLIF(SUBSTRING(BTRIM(COALESCE(o.dia_programacao::text, '')), 1, 10), ''),
      NULLIF(SUBSTRING(BTRIM(COALESCE(o.data_producao::text, '')), 1, 10), ''),
      NULLIF(SUBSTRING(BTRIM(COALESCE(o.dia::text, '')), 1, 10), '')
    ) AS dia_key,
    COALESCE(o.ordem_maquina, 0) AS ordem_maquina
  FROM ofs o
  WHERE o.deleted_at IS NULL
    AND COALESCE(o.passou_maquina, false) = false
    AND COALESCE(o.status, '') NOT ILIKE '%conclu%'
    AND COALESCE(o.status, '') NOT ILIKE '%cancel%'
)
SELECT
  b.maq_key,
  b.dia_key,
  count(*) AS total_na_particao,
  count(*) FILTER (WHERE b.ordem_maquina = 0) AS com_zero,
  count(*) FILTER (WHERE b.ordem_maquina > 0) AS ja_numeradas,
  max(b.ordem_maquina) AS maior_ordem_existente
FROM base b
GROUP BY b.maq_key, b.dia_key
HAVING count(*) FILTER (WHERE b.ordem_maquina = 0) > 0
ORDER BY 4 DESC, 1, 2;


-- ---------------------------------------------------------------------------
-- PASSO 3 · Conferência · lista as OFs a numerar (esperado: 355 linhas)
--           ordem atual exibida aproximada: data_entrega, depois número.
--           (a urgência manual — `urg`/`urgente` — é aplicada pelo app ANTES
--           disso; se houver OFs urgentes nesse conjunto, revise à mão.)
-- ---------------------------------------------------------------------------
WITH base AS (
  SELECT
    o.id,
    o.numero,
    o.status,
    COALESCE(o.ordem_maquina, 0) AS ordem_maquina,
    COALESCE(o.data_entrega::text, '') AS data_entrega,
    COALESCE(NULLIF(BTRIM(o.maquina_agendada), ''), NULLIF(BTRIM(o.maquina), '')) AS maq_key,
    COALESCE(
      NULLIF(SUBSTRING(BTRIM(COALESCE(o.dia_programacao::text, '')), 1, 10), ''),
      NULLIF(SUBSTRING(BTRIM(COALESCE(o.data_producao::text, '')), 1, 10), ''),
      NULLIF(SUBSTRING(BTRIM(COALESCE(o.dia::text, '')), 1, 10), '')
    ) AS dia_key
  FROM ofs o
  WHERE o.deleted_at IS NULL
    AND COALESCE(o.passou_maquina, false) = false
    AND COALESCE(o.status, '') NOT ILIKE '%conclu%'
    AND COALESCE(o.status, '') NOT ILIKE '%cancel%'
)
SELECT b.id, b.numero, b.status, b.maq_key, b.dia_key, b.ordem_maquina, b.data_entrega
FROM base b
WHERE b.ordem_maquina = 0
ORDER BY b.maq_key, b.dia_key, b.data_entrega, b.numero::text;


-- ---------------------------------------------------------------------------
-- PASSO 4 · Conferência · simulação 1..N por máquina e dia (sem gravar)
--           `nova_ordem` = posição proposta. As já numeradas (ordem > 0) ficam
--           na frente, na ordem atual; as em 0 entram depois, por
--           data_entrega -> número. Assim, dentro da partição não há repetido.
-- ---------------------------------------------------------------------------
WITH base AS (
  SELECT
    o.id,
    o.numero,
    COALESCE(o.ordem_maquina, 0) AS ordem_maquina,
    COALESCE(o.data_entrega::text, '') AS data_entrega,
    COALESCE(NULLIF(BTRIM(o.maquina_agendada), ''), NULLIF(BTRIM(o.maquina), '')) AS maq_key,
    COALESCE(
      NULLIF(SUBSTRING(BTRIM(COALESCE(o.dia_programacao::text, '')), 1, 10), ''),
      NULLIF(SUBSTRING(BTRIM(COALESCE(o.data_producao::text, '')), 1, 10), ''),
      NULLIF(SUBSTRING(BTRIM(COALESCE(o.dia::text, '')), 1, 10), '')
    ) AS dia_key
  FROM ofs o
  WHERE o.deleted_at IS NULL
    AND COALESCE(o.passou_maquina, false) = false
    AND COALESCE(o.status, '') NOT ILIKE '%conclu%'
    AND COALESCE(o.status, '') NOT ILIKE '%cancel%'
),
num AS (
  SELECT
    b.*,
    ROW_NUMBER() OVER (
      PARTITION BY b.maq_key, b.dia_key
      ORDER BY
        CASE WHEN b.ordem_maquina > 0 THEN 0 ELSE 1 END,
        b.ordem_maquina,
        b.data_entrega,
        b.numero::text
    ) AS nova_ordem
  FROM base b
)
SELECT n.id, n.numero, n.maq_key, n.dia_key, n.ordem_maquina, n.nova_ordem
FROM num n
WHERE n.maq_key IS NOT NULL
  AND n.dia_key IS NOT NULL
ORDER BY n.maq_key, n.dia_key, n.nova_ordem;


-- ---------------------------------------------------------------------------
-- PASSO 5 · PROPOSTA de ajuste (transação com ROLLBACK — não grava nada)
--           Renumera 1..N por máquina e dia SOMENTE as partições que têm pelo
--           menos uma OF em 0 (as partições já 100% numeradas não são tocadas).
-- ---------------------------------------------------------------------------
BEGIN;

WITH base AS (
  SELECT
    o.id,
    o.numero,
    COALESCE(o.ordem_maquina, 0) AS ordem_maquina,
    COALESCE(o.data_entrega::text, '') AS data_entrega,
    COALESCE(NULLIF(BTRIM(o.maquina_agendada), ''), NULLIF(BTRIM(o.maquina), '')) AS maq_key,
    COALESCE(
      NULLIF(SUBSTRING(BTRIM(COALESCE(o.dia_programacao::text, '')), 1, 10), ''),
      NULLIF(SUBSTRING(BTRIM(COALESCE(o.data_producao::text, '')), 1, 10), ''),
      NULLIF(SUBSTRING(BTRIM(COALESCE(o.dia::text, '')), 1, 10), '')
    ) AS dia_key
  FROM ofs o
  WHERE o.deleted_at IS NULL
    AND COALESCE(o.passou_maquina, false) = false
    AND COALESCE(o.status, '') NOT ILIKE '%conclu%'
    AND COALESCE(o.status, '') NOT ILIKE '%cancel%'
),
particoes AS (
  SELECT b.maq_key, b.dia_key
  FROM base b
  WHERE b.maq_key IS NOT NULL
    AND b.dia_key IS NOT NULL
  GROUP BY b.maq_key, b.dia_key
  HAVING count(*) FILTER (WHERE b.ordem_maquina = 0) > 0
),
num AS (
  SELECT
    b.id,
    ROW_NUMBER() OVER (
      PARTITION BY b.maq_key, b.dia_key
      ORDER BY
        CASE WHEN b.ordem_maquina > 0 THEN 0 ELSE 1 END,
        b.ordem_maquina,
        b.data_entrega,
        b.numero::text
    ) AS nova_ordem
  FROM base b
  JOIN particoes p
    ON p.maq_key = b.maq_key
   AND p.dia_key = b.dia_key
)
UPDATE ofs o
SET ordem_maquina = n.nova_ordem,
    updated_at = now()
FROM num n
WHERE o.id = n.id
  AND COALESCE(o.ordem_maquina, 0) IS DISTINCT FROM n.nova_ordem;
-- Esperado: UPDATE = quantidade de linhas cujo valor muda (<= 355 + as já
-- numeradas das mesmas partições). Confira contra o PASSO 4 antes de aprovar.

-- PASSO 5.1 · Conferência pós-UPDATE (esperado: 0 linhas)
SELECT o.id, o.numero, o.ordem_maquina
FROM ofs o
WHERE o.deleted_at IS NULL
  AND COALESCE(o.passou_maquina, false) = false
  AND COALESCE(o.status, '') NOT ILIKE '%conclu%'
  AND COALESCE(o.status, '') NOT ILIKE '%cancel%'
  AND COALESCE(o.ordem_maquina, 0) = 0;

ROLLBACK;


-- ---------------------------------------------------------------------------
-- PASSO 6 · Decisão · OFs da fila com máquina OU dia vazios (ficam de fora do
--           backfill). Esperado: as que aparecerem aqui precisam ser corrigidas
--           à mão (definir máquina/dia) antes — senão a numeração fica órfã.
-- ---------------------------------------------------------------------------
WITH base AS (
  SELECT
    o.id,
    o.numero,
    o.status,
    o.maquina,
    o.maquina_agendada,
    o.maquina_atual_index,
    o.fluxo_maquinas,
    o.dia,
    o.dia_programacao,
    o.data_producao,
    COALESCE(NULLIF(BTRIM(o.maquina_agendada), ''), NULLIF(BTRIM(o.maquina), '')) AS maq_key,
    COALESCE(
      NULLIF(SUBSTRING(BTRIM(COALESCE(o.dia_programacao::text, '')), 1, 10), ''),
      NULLIF(SUBSTRING(BTRIM(COALESCE(o.data_producao::text, '')), 1, 10), ''),
      NULLIF(SUBSTRING(BTRIM(COALESCE(o.dia::text, '')), 1, 10), '')
    ) AS dia_key
  FROM ofs o
  WHERE o.deleted_at IS NULL
    AND COALESCE(o.passou_maquina, false) = false
    AND COALESCE(o.status, '') NOT ILIKE '%conclu%'
    AND COALESCE(o.status, '') NOT ILIKE '%cancel%'
)
SELECT b.id, b.numero, b.status, b.maq_key, b.dia_key,
       b.maquina, b.maquina_agendada, b.maquina_atual_index, b.fluxo_maquinas,
       b.dia, b.dia_programacao, b.data_producao
FROM base b
WHERE b.maq_key IS NULL
   OR b.dia_key IS NULL
ORDER BY b.numero::text;


-- ---------------------------------------------------------------------------
-- PASSO 7 · Conferência final · distribuição da ordem por máquina e dia
--           (usar como "antes x depois" da fila do OFMAQ)
-- ---------------------------------------------------------------------------
SELECT
  COALESCE(NULLIF(BTRIM(o.maquina_agendada), ''), NULLIF(BTRIM(o.maquina), '')) AS maq_key,
  COALESCE(
    NULLIF(SUBSTRING(BTRIM(COALESCE(o.dia_programacao::text, '')), 1, 10), ''),
    NULLIF(SUBSTRING(BTRIM(COALESCE(o.data_producao::text, '')), 1, 10), ''),
    NULLIF(SUBSTRING(BTRIM(COALESCE(o.dia::text, '')), 1, 10), '')
  ) AS dia_key,
  count(*) AS qtd,
  count(*) FILTER (WHERE COALESCE(o.ordem_maquina, 0) = 0) AS ainda_em_zero,
  min(o.ordem_maquina) AS menor_ordem,
  max(o.ordem_maquina) AS maior_ordem
FROM ofs o
WHERE o.deleted_at IS NULL
  AND COALESCE(o.passou_maquina, false) = false
  AND COALESCE(o.status, '') NOT ILIKE '%conclu%'
  AND COALESCE(o.status, '') NOT ILIKE '%cancel%'
GROUP BY 1, 2
ORDER BY 4 DESC, 1, 2;
