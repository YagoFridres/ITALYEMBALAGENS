#!/bin/bash
# Diagnóstico (somente leitura): gramaturas dos retalhos — 17/11
source "$(dirname "$0")/../lib.sh"
sql -c "select fornecedor, nomenclatura, gramatura, count(*) itens, sum(quantidade) pecas, min(to_char(updated_at at time zone 'America/Sao_Paulo','DD/MM HH24:MI')) de, max(to_char(updated_at at time zone 'America/Sao_Paulo','DD/MM HH24:MI')) ate from chapas_estoque_v2 where categoria ilike 'retalho%' group by 1,2,3 order by 1,2,3" 2>&1
echo "== gramaturas das chapas inteiras por nomenclatura =="
sql -c "select fornecedor, nomenclatura, string_agg(distinct coalesce(gramatura::text,'—'), ', ') gramaturas from chapas_estoque_v2 where categoria not ilike 'retalho%' or categoria is null group by 1,2 order by 1,2" 2>&1
echo "== cadastro de gramaturas =="
sql -c "select * from gramaturas order by 1 limit 0" 2>&1 | head -2
sql -At -c "select string_agg(column_name,',') from information_schema.columns where table_name='gramaturas'" 2>&1
sql -c "select nome, gramatura, fornecedor from gramaturas where nome ilike 'CH%' or nome ilike '%AB21%' or nome ilike '%ADC21%' limit 30" 2>&1
