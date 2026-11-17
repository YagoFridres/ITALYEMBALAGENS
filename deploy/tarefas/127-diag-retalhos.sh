#!/bin/bash
# Diagnóstico (somente leitura): por que não está criando retalho — 17/11
source "$(dirname "$0")/../lib.sh"
echo "== categorias =="
sql -c "select nome, ordem from chapas_categorias order by ordem" 2>&1 | head -30
echo "== últimos cadastros de chapa (v2) =="
sql -c "select to_char(created_at at time zone 'America/Sao_Paulo','DD/MM HH24:MI') criado, categoria, nomenclatura, fornecedor, tamanho, quantidade from chapas_estoque_v2 order by created_at desc limit 12" 2>&1 | head -20
echo "== retalhos existentes =="
sql -c "select count(*) , max(created_at) from chapas_estoque_v2 where categoria ilike 'retalho%'" 2>&1
echo "== erros do app com chapas (hoje/ontem) =="
grep -h -i "chapas_estoque\|chapas_categorias\|salvarChapa" /root/.pm2/logs/pcp-pro-error*.log 2>/dev/null | tail -15 | cut -c1-260
echo "== colunas v2 =="
sql -At -c "select string_agg(column_name||':'||is_nullable,', ') from information_schema.columns where table_name='chapas_estoque_v2'" 2>&1
echo "== nomenclaturas x fornecedor (amostra) =="
sql -c "select nomenclatura, fornecedor, count(*) from chapas_estoque_v2 where coalesce(nomenclatura,'')<>'' group by 1,2 order by 3 desc limit 25" 2>&1
