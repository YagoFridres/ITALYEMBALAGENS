#!/bin/bash
# Diagnóstico (somente leitura): a soma de quantidade no retalho repetido entrou? — 17/11
source "$(dirname "$0")/../lib.sh"
sql -c "select id, nome_uso, tamanho, quantidade, quantidade_atual, to_char(updated_at at time zone 'America/Sao_Paulo','DD/MM HH24:MI') alt from chapas_estoque_v2 where categoria ilike 'retalho%' order by tamanho" 2>&1
echo "== tabelas de movimento =="
sql -At -c "select table_name from information_schema.tables where table_schema='public' and table_name ilike '%mov%'" 2>&1
for t in $(sql -At -c "select table_name from information_schema.tables where table_schema='public' and table_name ilike '%chapa%mov%'"); do
  echo "-- $t"; sql -c "select * from $t order by 1 desc limit 0" 2>&1 | head -2
  sql -At -c "select string_agg(column_name,',') from information_schema.columns where table_name='$t'" 2>&1
done
