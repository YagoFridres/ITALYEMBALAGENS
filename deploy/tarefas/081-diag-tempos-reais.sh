. deploy/lib.sh
sql <<'SQL'
\echo '== chaves usadas nos itens de fluxo_maquinas =='
select k, count(*) from public.ofs o, jsonb_array_elements(case when jsonb_typeof(o.fluxo_maquinas::jsonb)='array' then o.fluxo_maquinas::jsonb else '[]'::jsonb end) e, jsonb_object_keys(case when jsonb_typeof(e)='object' then e else '{}'::jsonb end) k
where o.deleted_at is null group by 1 order by 2 desc limit 40;
\echo '== etapas com tempo real e quantidade =='
select count(*) etapas, count(*) filter (where (e->>'tempo_producao_real_min') ~ '^[0-9.]+$' and (e->>'tempo_producao_real_min')::numeric > 0) com_tempo,
 count(*) filter (where (e->>'hora_inicio_producao') is not null) com_inicio, count(*) filter (where (e->>'qtd_produzida') ~ '^[0-9.]+$') com_qtd
from public.ofs o, jsonb_array_elements(case when jsonb_typeof(o.fluxo_maquinas::jsonb)='array' then o.fluxo_maquinas::jsonb else '[]'::jsonb end) e where o.deleted_at is null;
\echo '== por maquina: etapas com tempo real, minutos medianos, caixas/h mediana =='
select e->>'nome' maq, count(*), percentile_cont(0.5) within group (order by (e->>'tempo_producao_real_min')::numeric) med_min,
 percentile_cont(0.5) within group (order by (e->>'qtd_produzida')::numeric / nullif((e->>'tempo_producao_real_min')::numeric,0) * 60) med_cxh
from public.ofs o, jsonb_array_elements(case when jsonb_typeof(o.fluxo_maquinas::jsonb)='array' then o.fluxo_maquinas::jsonb else '[]'::jsonb end) e
where o.deleted_at is null and (e->>'tempo_producao_real_min') ~ '^[0-9.]+$' and (e->>'tempo_producao_real_min')::numeric > 0 and (e->>'qtd_produzida') ~ '^[0-9.]+$'
group by 1 order by 2 desc;
\echo '== colunas de tempo na tabela ofs e maquinas =='
select table_name, column_name from information_schema.columns where table_schema='public' and table_name in ('ofs','maquinas','passagens_maquina') and (column_name ilike '%tempo%' or column_name ilike '%setup%' or column_name ilike '%hora%' or column_name ilike '%inicio%' or column_name ilike '%fim%' or column_name ilike '%veloc%' or column_name ilike '%producao%') order by 1,2;
SQL
