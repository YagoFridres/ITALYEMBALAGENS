. deploy/lib.sh
sql <<'SQL'
\echo '== caixas_perdidas colunas =='
select string_agg(column_name, ', ' order by ordinal_position) from information_schema.columns where table_schema='public' and table_name='caixas_perdidas';
\echo '== perdas out/2026 por data =='
select count(*) ocorr, sum(coalesce(quantidade,0)) cx from public.caixas_perdidas where coalesce(data::date, created_at::date) between '2026-10-01' and '2026-10-31';
\echo '== perdas 31/10 =='
select count(*) from public.caixas_perdidas where coalesce(data::date, created_at::date) = '2026-10-31';
\echo '== OFs vendidas out: perda nos campos da OF / toneladas =='
with v as (select * from public.ofs where deleted_at is null and status ilike '%conclu%' and coalesce(data_faturamento, data_conclusao::date, dia::date, created_at::date) between '2026-10-01' and '2026-10-31')
select count(*) ofs, sum(coalesce(qtd_perdida, caixas_perdidas, 0)) perda_campos, sum(coalesce(tonelada_vendida,0)) ton_vendida, count(*) filter (where coalesce(tonelada_vendida,0) > 0) ofs_com_ton, count(*) filter (where gramatura_id is null) sem_gramatura from v;
\echo '== movimentos estoque out =='
select tipo, count(*), sum(quantidade) from public.chapas_movimentos where created_at::date between '2026-10-01' and '2026-10-31' group by tipo;
\echo '== compras_chapas por mes =='
select to_char(coalesce(data_compra::date, criado_em::date), 'YYYY-MM') mes, count(*) from public.compras_chapas group by 1 order by 1;
SQL
