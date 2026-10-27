. deploy/lib.sh
echo "== tabelas com maquin no nome"
sql -At -c "select table_name, (xpath('/row/c/text()', query_to_xml('select count(*) as c from public.'||table_name, false, true, '')))[1]::text from information_schema.tables where table_schema='public' and table_name ilike '%maquin%';"
echo "== colunas maquinas"
sql -At -c "select column_name||':'||data_type from information_schema.columns where table_name='maquinas' order by ordinal_position;" | tr '\n' ' '; echo
echo "== linhas"
sql -At -c "select row_to_json(m)::text from public.maquinas m limit 20;" | cut -c1-600
echo "== config / json com maquinas"
sql -At -c "select table_name from information_schema.columns where table_schema='public' and column_name ilike '%setup%' group by 1;" | tr '\n' ' '; echo
sql -At -c "select chave, left(valor::text,800) from public.configuracoes where chave ilike '%maq%' limit 10;" 2>&1 | cut -c1-900
sql -At -c "select table_name from information_schema.tables where table_schema='public' and table_name ilike '%config%';" | tr '\n' ' '
