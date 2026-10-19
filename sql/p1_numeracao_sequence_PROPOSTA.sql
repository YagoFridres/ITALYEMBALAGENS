-- ============================================================================
-- PROPOSTA · P1 · OF Rápida · numeração de OF por SEQUENCE no banco
-- ============================================================================
-- STATUS: NÃO EXECUTADO. Aguarda aprovação do Yago.
-- Nada no código (server.js / patch.js) chama esta função ainda. É só proposta.
--
-- MOTIVO
--   Hoje o servidor calcula "MAX(numero clássico) + 1" e depois tenta inserir.
--   Com o UNIQUE global `ofs_numero_key`, dois POSTs simultâneos podem escolher
--   o mesmo número; o insert falha e o servidor recalcula (retry). A correção
--   do P1 já torna o retry global e seguro, mas o ideal é o banco reservar o
--   número de forma atômica.
--
-- EFEITO
--   `proxima_of_numero()` devolve um número único (nextval) sem corrida.
--   A sequence começa em max(número de negócio) + 1, então NÃO reutiliza
--   nenhum número existente.
--
-- COMO LIGAR DEPOIS (fora do escopo deste PR)
--   No POST /api/ofs, quando o front não enviar número >= 1000, chamar
--   `rpc('proxima_of_numero')` e usar o retorno em `filtered.numero`/`filtered.of`.
-- ============================================================================

begin;

-- 1) Cria a sequence (idempotente).
create sequence if not exists public.ofs_numero_seq;

-- 2) Posiciona a sequence em max(número de negócio) + 1 (mínimo 1000).
--    Usa `setval(..., false)` para que o PRÓXIMO nextval devolva exatamente
--    esse valor (sem "queimar" um número).
do $$
declare
  v_max bigint := 0;
begin
  select greatest(
    coalesce(max(nullif(regexp_replace(coalesce(numero, ''), '\D', '', 'g'), '')::bigint), 0),
    coalesce(max(nullif(regexp_replace(coalesce(of_num,  ''), '\D', '', 'g'), '')::bigint), 0),
    coalesce(max(nullif(regexp_replace(coalesce(of_seq,  ''), '\D', '', 'g'), '')::bigint), 0),
    coalesce(max(nullif(regexp_replace(coalesce(of,      ''), '\D', '', 'g'), '')::bigint), 0),
    coalesce(max(coalesce(seq, 0)), 0)
  )
  into v_max
  from public.ofs;

  perform setval('public.ofs_numero_seq', greatest(v_max + 1, 1000), false);

  raise notice 'ofs_numero_seq posicionada em %', greatest(v_max + 1, 1000);
end $$;

-- 3) Função pública de reserva (SECURITY DEFINER; acesso só para service_role).
create or replace function public.proxima_of_numero()
returns bigint
language sql
security definer
set search_path = public
as $$
  select nextval('public.ofs_numero_seq')::bigint;
$$;

revoke all on function public.proxima_of_numero() from public;
revoke all on function public.proxima_of_numero() from anon;
revoke all on function public.proxima_of_numero() from authenticated;
grant execute on function public.proxima_of_numero() to service_role;

-- 4) Conferência (somente leitura).
select last_value, is_called from public.ofs_numero_seq;

commit;

-- ============================================================================
-- REVERSÃO
-- ============================================================================
-- begin;
--   drop function if exists public.proxima_of_numero();
--   drop sequence if exists public.ofs_numero_seq;
-- commit;
-- ============================================================================
