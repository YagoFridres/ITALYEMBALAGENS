. deploy/lib.sh
sql <<'SQL'
\echo '== empresas =='
select * from public.empresas;
\echo '== colunas compras_chapas =='
select column_name, data_type from information_schema.columns where table_schema='public' and table_name='compras_chapas' order by ordinal_position;
\echo '== compras por empresa =='
select empresa_id, count(*) from public.compras_chapas group by 1;
SQL
