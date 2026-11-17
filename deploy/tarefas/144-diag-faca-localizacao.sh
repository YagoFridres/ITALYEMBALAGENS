#!/bin/bash
# Diagnóstico: por que "localizacao" da faca não grava — 17/11 (teste com ROLLBACK + recarrega cache da API)
source "$(dirname "$0")/../lib.sh"
sql -c "select tgname, pg_get_triggerdef(oid) from pg_trigger where tgrelid='public.facas_estoque'::regclass and not tgisinternal" 2>&1
sql -c "select column_name, data_type, column_default from information_schema.columns where table_name='facas_estoque' and column_name in ('localizacao','local_armazenamento')" 2>&1
sql <<'SQL' 2>&1
begin;
update facas_estoque set localizacao='TESTE SQL' where id='1484e63b-bb26-4a07-ba4c-63ee9913c0aa' returning localizacao;
rollback;
SQL
recarregar_api
echo "cache da API recarregado"
grep -h "facas" /root/.pm2/logs/pcp-pro-error*.log 2>/dev/null | tail -5 | cut -c1-250
