#!/bin/bash
# Diagnóstico 2 (somente leitura / transação desfeita): criar retalho falha? — 17/11
source "$(dirname "$0")/../lib.sh"
echo "== restrições e gatilhos de chapas_estoque_v2 =="
sql -c "select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid='public.chapas_estoque_v2'::regclass" 2>&1
sql -c "select indexname, indexdef from pg_indexes where tablename='chapas_estoque_v2' and indexdef ilike '%unique%'" 2>&1
sql -c "select tgname, pg_get_triggerdef(oid) from pg_trigger where tgrelid='public.chapas_estoque_v2'::regclass and not tgisinternal" 2>&1
echo "== retalhos existentes =="
sql -c "select count(*), max(updated_at) from chapas_estoque_v2 where categoria ilike 'retalho%'" 2>&1
sql -c "select to_char(updated_at at time zone 'America/Sao_Paulo','DD/MM HH24:MI') alt, categoria, nomenclatura, fornecedor, tamanho, quantidade from chapas_estoque_v2 order by updated_at desc limit 8" 2>&1
echo "== teste de insert (DESFEITO com ROLLBACK) =="
sql <<'SQL' 2>&1
begin;
insert into chapas_estoque_v2 (nome_uso, fornecedor, nomenclatura, tamanho, categoria, quantidade, emp_id, empresa_vinculada, estoque_minimo)
values ('TESTE RETALHO DIAG', 'ADAMI', 'ADC21', '1000X800', 'Retalhos', 0, 'E1', 'Italy Embalagens', 200) returning id, categoria;
rollback;
SQL
echo "== nomenclatura x fornecedor =="
sql -c "select upper(trim(nomenclatura)) nom, upper(trim(fornecedor)) forn, count(*) from chapas_estoque_v2 where coalesce(trim(nomenclatura),'')<>'' group by 1,2 order by 1 limit 80" 2>&1
