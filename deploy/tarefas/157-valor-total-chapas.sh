#!/usr/bin/env bash
# 18/11: valor_total da chapa = saldo x valor unitário (zerou a quantidade, zera o total) — trigger + correção dos registros
source deploy/lib.sh
sql -c "select column_name, is_generated, generation_expression from information_schema.columns where table_name='chapas_estoque_v2' and column_name in ('valor_total','quantidade','quantidade_atual','valor_unitario');"
sql <<'SQL'
create or replace function chapas_v2_calc_valor_total() returns trigger language plpgsql as $$
begin
  new.valor_total := round((coalesce(new.quantidade_atual, new.quantidade, 0)::numeric * coalesce(new.valor_unitario, 0)::numeric), 2);
  return new;
end $$;
drop trigger if exists trg_chapas_v2_valor_total on chapas_estoque_v2;
create trigger trg_chapas_v2_valor_total before insert or update on chapas_estoque_v2 for each row execute function chapas_v2_calc_valor_total();
select count(*) as errados_antes from chapas_estoque_v2 where coalesce(valor_total,0) <> round(coalesce(quantidade_atual, quantidade, 0)::numeric * coalesce(valor_unitario,0)::numeric, 2);
update chapas_estoque_v2 set valor_total = round(coalesce(quantidade_atual, quantidade, 0)::numeric * coalesce(valor_unitario,0)::numeric, 2) where coalesce(valor_total,0) <> round(coalesce(quantidade_atual, quantidade, 0)::numeric * coalesce(valor_unitario,0)::numeric, 2);
select count(*) as errados_depois from chapas_estoque_v2 where coalesce(valor_total,0) <> round(coalesce(quantidade_atual, quantidade, 0)::numeric * coalesce(valor_unitario,0)::numeric, 2);
SQL
recarregar_api
