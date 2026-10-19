-- ============================================================================
-- P1 · OF Rápida · backfill de `empresa_id` nas OFs antigas  (ARQUIVO · NÃO EXECUTADO)
-- ============================================================================
-- STATUS: NÃO EXECUTADO. Aguarda aprovação do Yago.
--
-- Causa raiz (confirmada em 19/10, somente leitura):
--   O front gravava o CÓDIGO da empresa ('E1'/'E2'/'E3') no campo `empresa_id`.
--   O `ofIn()` apagava esse valor em silêncio e a OF era inserida sem empresa.
--   Resultado: 450 de 455 OFs desde 25/09 ficaram com `empresa_id = null`,
--   embora o `emp_id` (código) esteja correto.
--
-- O QUE ESTE ARQUIVO FAZ
--   1) PRÉVIA (somente leitura): quantas OFs sem empresa e por qual código.
--   2) BACKUP + UPDATE (transação): copia os ids afetados para
--      `public._bkp_p1_empresa` e preenche `empresa_id` a partir do `emp_id`,
--      APENAS onde `empresa_id is null`. Termina com ROLLBACK por padrão.
--   3) CORREÇÃO do UUID da Oestepack gravado com erro de digitação.
--      Termina com ROLLBACK por padrão.
--   4) VALIDAÇÃO (somente leitura).
--   5) REVERSÃO (a partir da tabela de backup).
--
-- COMO APLICAR (somente após aprovação explícita)
--   - rodar como `service_role` (ou role com RLS ignorado);
--   - em cada bloco, revisar o resultado da conferência e então trocar o
--     `rollback;` final por `commit;`.
--   - aplicar em homologação primeiro.
--
-- NENHUMA ALTERAÇÃO É FEITA AO RODAR ESTE ARQUIVO COMO ESTÁ (tudo em ROLLBACK).
-- ============================================================================

-- UUIDs canônicos das empresas (ver lib/empresa.js · EMPRESAS_FALLBACK).
--   E1 ITALY  · Italy Embalagens · df5f7672-0a6b-402d-ae65-296554236c31
--   E2 CARTO  · Cartoeste        · e9b734dc-c7d5-4b04-898d-1ec7affa721e
--   E3 OESTE  · Oestepack        · a6e5f5d8-4743-4ebe-885e-c2f0741a667a
-- UUID da Oestepack gravado com erro de digitação (a corrigir):
--   a6e5f5d8-4743-4ebe-885e-c2f0f741a667


-- ============================================================================
-- 1) PRÉVIA — SOMENTE LEITURA (pode rodar sem medo)
-- ============================================================================

-- 1.1) Quantas OFs estão sem empresa, agrupadas pelo código gravado.
select
  coalesce(nullif(upper(trim(coalesce(emp_id, ''))), ''), '(vazio)') as emp_id_codigo,
  count(*) as ofs_sem_empresa
from public.ofs
where empresa_id is null
group by 1
order by 2 desc;

-- 1.2) Amostra das OFs que este backfill vai corrigir.
select id, numero, emp_id, empresa_id, created_at
from public.ofs
where empresa_id is null
  and upper(trim(coalesce(emp_id, ''))) in ('E1', 'E2', 'E3')
order by created_at desc
limit 20;

-- 1.3) OFs sem empresa E sem código válido (não são corrigíveis por este script).
select id, numero, emp_id, empresa_id, created_at
from public.ofs
where empresa_id is null
  and upper(trim(coalesce(emp_id, ''))) not in ('E1', 'E2', 'E3')
order by created_at desc
limit 20;


-- ============================================================================
-- 2) BACKUP + UPDATE (transação) — termina com ROLLBACK por padrão
-- ============================================================================
begin;

-- 2.1) Tabela de backup (provisória/persistente) — guarda o estado ANTES.
--      Precisa ser persistente (não TEMP) para que a REVERSÃO (§5) funcione
--      em outra sessão. Apague-a após validar/decidir.
create table if not exists public._bkp_p1_empresa (
  of_id            uuid primary key,
  empresa_id_antes uuid,
  emp_id_antes     text,
  backup_at        timestamptz not null default now()
);

-- 2.2) Copia os ids que serão alterados.
insert into public._bkp_p1_empresa (of_id, empresa_id_antes, emp_id_antes)
select id, empresa_id, emp_id
from public.ofs
where empresa_id is null
  and upper(trim(coalesce(emp_id, ''))) in ('E1', 'E2', 'E3')
on conflict (of_id) do nothing;

-- 2.3) Copia as OFs com o UUID da Oestepack digitado errado (corrigidas na §3).
insert into public._bkp_p1_empresa (of_id, empresa_id_antes, emp_id_antes)
select id, empresa_id, emp_id
from public.ofs
where empresa_id::text = 'a6e5f5d8-4743-4ebe-885e-c2f0f741a667'
on conflict (of_id) do nothing;

-- 2.4) UPDATE: preenche empresa_id a partir do emp_id, SÓ onde está null.
update public.ofs
set empresa_id = case upper(trim(coalesce(emp_id, '')))
    when 'E1' then 'df5f7672-0a6b-402d-ae65-296554236c31'
    when 'E2' then 'e9b734dc-c7d5-4b04-898d-1ec7affa721e'
    when 'E3' then 'a6e5f5d8-4743-4ebe-885e-c2f0741a667a'
  end
where empresa_id is null
  and upper(trim(coalesce(emp_id, ''))) in ('E1', 'E2', 'E3');

-- 2.5) Conferência dentro da transação.
select
  count(*)                                                                 as total_ofs,
  count(*) filter (where empresa_id is null)                               as ainda_sem_empresa,
  count(*) filter (where empresa_id is null
                     and upper(trim(coalesce(emp_id, ''))) in ('E1','E2','E3')) as corrigiveis,
  count(*) filter (where upper(trim(coalesce(emp_id, ''))) in ('E1','E2','E3')) as com_codigo_valido
from public.ofs;

-- 2.6) Linhas efetivamente guardadas no backup.
select count(*) as linhas_backup from public._bkp_p1_empresa;

-- AÇÃO PADRÃO: não aplica nada.
rollback;
-- Após aprovação e revisão da conferência acima, troque a linha anterior por:
-- commit;


-- ============================================================================
-- 3) CORREÇÃO DO UUID COM ERRO DE DIGITAÇÃO (Oestepack) — ROLLBACK por padrão
-- ============================================================================
begin;

-- 3.1) Quantas OFs carregam o UUID errado.
select count(*) as ofs_com_uuid_errado
from public.ofs
where empresa_id::text = 'a6e5f5d8-4743-4ebe-885e-c2f0f741a667';

-- 3.2) Corrige para o UUID canônico.
update public.ofs
set empresa_id = 'a6e5f5d8-4743-4ebe-885e-c2f0741a667a'
where empresa_id::text = 'a6e5f5d8-4743-4ebe-885e-c2f0f741a667';

-- 3.3) Conferência: deve retornar 0.
select count(*) as restantes_com_uuid_errado
from public.ofs
where empresa_id::text = 'a6e5f5d8-4743-4ebe-885e-c2f0f741a667';

rollback;
-- Após aprovação, troque a linha anterior por:
-- commit;


-- ============================================================================
-- 4) VALIDAÇÃO — SOMENTE LEITURA
-- ============================================================================

-- 4.1) Distribuição final por empresa.
select
  coalesce(empresa_id::text, '(null)') as empresa_id,
  upper(trim(coalesce(emp_id, '')))    as emp_id_codigo,
  count(*)                             as total
from public.ofs
group by 1, 2
order by 3 desc;

-- 4.2) Nenhuma OF deve continuar sem empresa com código válido.
select count(*) as pendentes_com_codigo_valido
from public.ofs
where empresa_id is null
  and upper(trim(coalesce(emp_id, ''))) in ('E1', 'E2', 'E3');

-- 4.3) Consistência: empresa_id (UUID) x emp_id (código) — divergências.
select id, numero, emp_id, empresa_id
from public.ofs
where (upper(trim(coalesce(emp_id, ''))) = 'E1'
        and empresa_id::text <> 'df5f7672-0a6b-402d-ae65-296554236c31')
   or (upper(trim(coalesce(emp_id, ''))) = 'E2'
        and empresa_id::text <> 'e9b734dc-c7d5-4b04-898d-1ec7affa721e')
   or (upper(trim(coalesce(emp_id, ''))) = 'E3'
        and empresa_id::text <> 'a6e5f5d8-4743-4ebe-885e-c2f0741a667a')
order by created_at desc
limit 50;


-- ============================================================================
-- 5) REVERSÃO — desfaz o que este script aplicou, usando o backup
-- ============================================================================
-- Roda somente se o §2/§3 já tiverem sido aplicados (commit) e houver
-- necessidade de voltar ao estado anterior. Restaura o valor guardado em
-- `_bkp_p1_empresa` e, ao final, pode apagar o backup.
-- begin;
--   update public.ofs o
--   set empresa_id = b.empresa_id_antes
--   from public._bkp_p1_empresa b
--   where o.id = b.of_id
--     and o.empresa_id is distinct from b.empresa_id_antes;
--
--   -- Conferência após reverter.
--   select count(*) as ainda_sem_empresa
--   from public.ofs where empresa_id is null;
-- commit;
--
-- -- Após confirmar a reversão, remova o backup:
-- -- drop table if exists public._bkp_p1_empresa;
-- ============================================================================
