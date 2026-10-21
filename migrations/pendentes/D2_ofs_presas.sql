-- ============================================================================
-- D2_ofs_presas.sql  ·  item OFMAQ-04  ·  "Passou pela máquina" deixa a OF presa
-- ----------------------------------------------------------------------------
-- NÃO EXECUTAR. Este arquivo é apenas a PROPOSTA de correção de dados, com o
-- SELECT de conferência e o ROLLBACK explícito (nada é gravado).
--
-- Contexto (prompt OFMAQ-04, linhas 481-501):
--   a rota POST /api/ofs/:id/passou-maquina gravava `passou_maquina = true` sem
--   mudar o `status`. A OF saía de todas as filas do OFMAQ (isPassedMachine) e
--   continuava contando como aberta no PCP/Dashboard -> divergência 397 (PCP /
--   Dashboard) x 385 (OFMAQ).
--
--   Com a regra nova: `passou_maquina = true` só é gravado na ÚLTIMA etapa do
--   fluxo (ou em OF sem fluxo). Etapa intermediária apenas avança
--   (`maquina_atual_index + 1` e `maquina_agendada = fluxo_maquinas[idx]`).
--
--   => as 12 OFs abaixo estão "Em aberto" E com `passou_maquina = true`: são
--      resíduo da regra antiga. O ajuste proposto devolve a OF para a fila, na
--      etapa ATUAL do fluxo (a etapa em que ela realmente está), sem tocar em
--      status, dia de produção, data de entrega, estoque, numeração ou comissão.
--
-- Números esperados: 798, 540, 539, 318, 537, 317, 419, 316, 2745, 1174, 473, 273
-- Linhas esperadas no passo 1 e no passo 3: 12
-- Linhas esperadas no passo 4 (após o UPDATE): 0
-- ============================================================================


-- ---------------------------------------------------------------------------
-- PASSO 1 · Conferência · lista as 12 OFs presas   (esperado: 12 linhas)
-- ---------------------------------------------------------------------------
SELECT
  o.id,
  o.numero,
  o.status,
  o.passou_maquina,
  o.passou_em,
  o.passou_maquina_nome,
  o.maquina,
  o.maquina_agendada,
  o.maquina_atual_index,
  pg_typeof(o.fluxo_maquinas) AS tipo_fluxo_maquinas,
  o.fluxo_maquinas,
  o.empresa_id,
  o.dia,
  o.dia_programacao,
  o.data_producao,
  o.data_entrega,
  o.updated_at
FROM ofs o
WHERE o.status = 'Em aberto'
  AND COALESCE(o.passou_maquina, false) = true
  AND o.deleted_at IS NULL
  AND o.numero::text IN (
    '798','540','539','318','537','317','419','316','2745','1174','473','273'
  )
ORDER BY o.numero::text;


-- ---------------------------------------------------------------------------
-- PASSO 2 · Conferência · total global (deve casar com o que PCP/Dashboard
--           contam a mais que o OFMAQ: 397 - 385 = 12)
-- ---------------------------------------------------------------------------
SELECT count(*) AS total_ofs_abertas_com_passou_maquina
FROM ofs o
WHERE o.status = 'Em aberto'
  AND COALESCE(o.passou_maquina, false) = true
  AND o.deleted_at IS NULL;


-- ---------------------------------------------------------------------------
-- PASSO 3 · PROPOSTA de ajuste (transação com ROLLBACK — não grava nada)
--
--   Libera a OF de volta para a fila: `passou_maquina = false`, `passou_em = NULL`
--   e aponta `maquina_agendada` para a ETAPA ATUAL do fluxo
--   (`fluxo_maquinas[coalesce(maquina_atual_index, 0)]`), que é exatamente onde
--   activeOfRow passa a exibir a OF depois da correção do OFMAQ-04.
--
--   ATENÇÃO: o UPDATE abaixo usa `jsonb_array_length`/`jsonb_typeof` — antes de
--   rodar, confirme no PASSO 1 que `tipo_fluxo_maquinas` é `jsonb`. Se o PASSO 1
--   mostrar outro tipo (ex.: `text`), use a variante comentada no PASSO 6.
-- ---------------------------------------------------------------------------
BEGIN;

UPDATE ofs o
SET
  passou_maquina = false,
  passou_em = NULL,
  maquina_agendada = COALESCE(
    CASE
      WHEN jsonb_typeof(o.fluxo_maquinas) = 'array'
       AND jsonb_array_length(o.fluxo_maquinas) > 0
      THEN (
        CASE
          WHEN jsonb_typeof(
                 o.fluxo_maquinas
                 -> LEAST(
                      GREATEST(COALESCE(o.maquina_atual_index, 0), 0),
                      jsonb_array_length(o.fluxo_maquinas) - 1
                    )
               ) = 'string'
          THEN o.fluxo_maquinas ->> LEAST(
                 GREATEST(COALESCE(o.maquina_atual_index, 0), 0),
                 jsonb_array_length(o.fluxo_maquinas) - 1
               )
          WHEN jsonb_typeof(
                 o.fluxo_maquinas
                 -> LEAST(
                      GREATEST(COALESCE(o.maquina_atual_index, 0), 0),
                      jsonb_array_length(o.fluxo_maquinas) - 1
                    )
               ) = 'object'
          THEN COALESCE(
                 o.fluxo_maquinas -> LEAST(
                   GREATEST(COALESCE(o.maquina_atual_index, 0), 0),
                   jsonb_array_length(o.fluxo_maquinas) - 1
                 ) ->> 'nome',
                 o.fluxo_maquinas -> LEAST(
                   GREATEST(COALESCE(o.maquina_atual_index, 0), 0),
                   jsonb_array_length(o.fluxo_maquinas) - 1
                 ) ->> 'maquina',
                 o.fluxo_maquinas -> LEAST(
                   GREATEST(COALESCE(o.maquina_atual_index, 0), 0),
                   jsonb_array_length(o.fluxo_maquinas) - 1
                 ) ->> 'col'
               )
          ELSE NULL
        END
      )
      ELSE NULL
    END,
    o.maquina_agendada
  ),
  updated_at = now()
WHERE o.status = 'Em aberto'
  AND COALESCE(o.passou_maquina, false) = true
  AND o.deleted_at IS NULL
  AND o.numero::text IN (
    '798','540','539','318','537','317','419','316','2745','1174','473','273'
  );
-- Esperado: UPDATE 12

-- PASSO 4 · Conferência pós-UPDATE (esperado: 0 linhas)
SELECT o.numero, o.status, o.passou_maquina, o.maquina_agendada, o.maquina_atual_index
FROM ofs o
WHERE o.status = 'Em aberto'
  AND COALESCE(o.passou_maquina, false) = true
  AND o.deleted_at IS NULL
  AND o.numero::text IN (
    '798','540','539','318','537','317','419','316','2745','1174','473','273'
  )
ORDER BY o.numero::text;

-- PASSO 5 · Conferência final — as 12 voltaram para a fila na etapa atual
--           (esperado: 12 linhas, todas com passou_maquina = false)
SELECT
  o.numero,
  o.status,
  o.passou_maquina,
  o.maquina_agendada,
  o.maquina_atual_index,
  o.dia,
  o.dia_programacao,
  o.data_producao,
  o.data_entrega
FROM ofs o
WHERE o.deleted_at IS NULL
  AND o.numero::text IN (
    '798','540','539','318','537','317','419','316','2745','1174','473','273'
  )
ORDER BY o.numero::text;

ROLLBACK;

-- ---------------------------------------------------------------------------
-- PASSO 6 · Variante caso `fluxo_maquinas` NÃO seja jsonb (ex.: text)
--           Trocar a expressão de `maquina_agendada` por NULL e revisar
--           `maquina_agendada`/`maquina_atual_index` manualmente pelo PASSO 1.
-- ---------------------------------------------------------------------------
-- BEGIN;
-- UPDATE ofs o
-- SET passou_maquina = false,
--     passou_em = NULL,
--     updated_at = now()
-- WHERE o.status = 'Em aberto'
--   AND COALESCE(o.passou_maquina, false) = true
--   AND o.deleted_at IS NULL
--   AND o.numero::text IN (
--     '798','540','539','318','537','317','419','316','2745','1174','473','273'
--   );
-- -- Esperado: UPDATE 12
-- ROLLBACK;
