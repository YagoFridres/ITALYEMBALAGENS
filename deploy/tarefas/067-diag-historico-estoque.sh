. deploy/lib.sh
sql <<'SQL'
\echo '== historico_acoes estoque por mes/tipo =='
select to_char(created_at,'YYYY-MM') mes, tipo_acao, count(*) from public.historico_acoes where tipo_acao in ('estoque_entrada','estoque_saida','estoque_ajuste','estoque_manual','estoque_chapas_patch','baixa_of') and created_at >= '2026-07-01' group by 1,2 order by 1 desc,2;
\echo '== tabelas com entrada no nome =='
select table_name from information_schema.tables where table_schema='public' and (table_name ilike '%entrada%' or table_name ilike '%estoque%');
\echo '== chapas_estoque_v2 atualizadas em out (proxy de entrada manual) =='
select count(*) from public.chapas_estoque_v2 where updated_at >= '2026-10-01';
SQL
