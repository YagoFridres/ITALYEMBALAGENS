#!/bin/bash
# Diagnóstico (somente leitura): onde estão as facas — 17/11
source "$(dirname "$0")/../lib.sh"
for t in $(sql -At -c "select table_name from information_schema.tables where table_schema='public' and table_name ilike '%faca%'"); do
  echo "-- $t: $(sql -At -c "select count(*) from public.$t")"
  sql -At -c "select string_agg(column_name||':'||data_type,', ' order by ordinal_position) from information_schema.columns where table_schema='public' and table_name='$t'"
done
echo "== amostra facas_estoque =="
sql -c "select id, numero, nome, categoria, medidas, localizacao, emp_id, empresa_id from facas_estoque order by nome limit 8" 2>&1
echo "== RLS / políticas =="
sql -c "select tablename, rowsecurity from pg_tables where tablename ilike '%faca%'" 2>&1
sql -c "select tablename, policyname, cmd, roles from pg_policies where tablename ilike '%faca%'" 2>&1
echo "== erros recentes =="
grep -h -i "faca" /root/.pm2/logs/pcp-pro-error*.log 2>/dev/null | tail -8 | cut -c1-250
