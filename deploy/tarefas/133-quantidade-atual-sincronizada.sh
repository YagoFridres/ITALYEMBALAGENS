#!/bin/bash
# 17/11: chapas_estoque_v2 tem dois campos de saldo (quantidade e quantidade_atual).
# Alguns movimentos (desfazer/ajustar movimento) só mudavam "quantidade" e a tela mostrava o valor velho.
# Agora o banco mantém os dois sempre iguais.
source "$(dirname "$0")/../lib.sh"
sql <<'SQL'
begin;
create or replace function public.chapas_v2_sync_qtd_atual() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if new.quantidade_atual is null or new.quantidade_atual <> new.quantidade then new.quantidade_atual := new.quantidade; end if;
  elsif new.quantidade is distinct from old.quantidade and new.quantidade_atual is not distinct from old.quantidade_atual then
    new.quantidade_atual := new.quantidade;
  elsif new.quantidade_atual is distinct from old.quantidade_atual and new.quantidade is not distinct from old.quantidade then
    new.quantidade := new.quantidade_atual;
  end if;
  return new;
end $$;
drop trigger if exists trg_chapas_v2_sync_qtd_atual on public.chapas_estoque_v2;
create trigger trg_chapas_v2_sync_qtd_atual before insert or update on public.chapas_estoque_v2
  for each row execute function public.chapas_v2_sync_qtd_atual();
commit;
-- só lista os que estão diferentes (nada é alterado aqui)
select id, categoria, nome_uso, tamanho, quantidade, quantidade_atual, to_char(updated_at at time zone 'America/Sao_Paulo','DD/MM HH24:MI') alt from public.chapas_estoque_v2 where quantidade_atual is not null and quantidade_atual <> quantidade;
select count(*) filter (where quantidade_atual is null) sem_atual, count(*) total from public.chapas_estoque_v2;
SQL
recarregar_api
