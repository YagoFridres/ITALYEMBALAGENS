. deploy/lib.sh
sql <<'SQL'
\echo '== OFs vendidas out/2026: empresa_id x emp_id =='
with v as (select * from public.ofs where deleted_at is null and status ilike '%conclu%' and coalesce(data_conclusao, data_faturamento::timestamptz, dia::timestamptz, created_at) at time zone 'America/Sao_Paulo' >= '2026-10-01' and coalesce(data_conclusao, data_faturamento::timestamptz, dia::timestamptz, created_at) at time zone 'America/Sao_Paulo' < '2026-11-01')
select coalesce(e.nome, empresa_id::text, '(nulo)') empresa_id, coalesce(emp_id,'(nulo)') emp_id, count(*), round(sum(coalesce(valor_total,0))::numeric,2) valor
from v left join public.empresas e on e.id::text = v.empresa_id::text group by 1,2 order by 1,2;
\echo '== todas as OFs: empresa_id x emp_id =='
select coalesce(e.nome, o.empresa_id::text, '(nulo)') empresa_id, coalesce(o.emp_id,'(nulo)') emp_id, count(*) from public.ofs o left join public.empresas e on e.id::text = o.empresa_id::text where o.deleted_at is null group by 1,2 order by 1,2;
\echo '== exemplos divergentes (out) =='
select o.of || ' | ' || coalesce(o.cliente_nome, o.clinome, '') || ' | ' || coalesce(e.nome, o.empresa_id::text,'') || ' | ' || coalesce(o.emp_id,'') from public.ofs o left join public.empresas e on e.id::text=o.empresa_id::text
where o.deleted_at is null and o.status ilike '%conclu%' and o.data_conclusao >= '2026-10-01' and ((o.emp_id='E1' and o.empresa_id::text<>'df5f7672-0a6b-402d-ae65-296554236c31') or (o.emp_id='E2' and o.empresa_id::text<>'e9b734dc-c7d5-4b04-898d-1ec7affa721e') or (o.emp_id='E3' and o.empresa_id::text<>'a6e5f5d8-4743-4ebe-885e-c2f0741a667a') or o.empresa_id is null) limit 30;
SQL
