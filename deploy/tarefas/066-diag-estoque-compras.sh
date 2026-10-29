. deploy/lib.sh
sql -At -c "select string_agg(column_name, ', ') from information_schema.columns where table_name='chapas_estoque_movimentos_v2';"
sql <<'SQL'
\echo '== tabelas de movimento =='
select table_name from information_schema.tables where table_schema='public' and table_name ilike '%mov%';
\echo '== movimentos v2 por tipo (out/2026) =='
select tipo, count(*) from public.chapas_estoque_movimentos_v2 where created_at >= '2026-10-01' and created_at < '2026-11-01' group by tipo;
\echo '== movimentos v2 por mes e tipo (ultimos) =='
select to_char(created_at,'YYYY-MM') mes, tipo, count(*) from public.chapas_estoque_movimentos_v2 group by 1,2 order by 1 desc, 2 limit 20;
\echo '== compras_chapas (numero | data | status) =='
select coalesce(numero_compra::text,'') || ' | ' || coalesce(data_compra::text,'') || ' | ' || coalesce(criado_em::text,'') || ' | ' || coalesce(status,'') from public.compras_chapas order by criado_em desc nulls last limit 15;
SQL
