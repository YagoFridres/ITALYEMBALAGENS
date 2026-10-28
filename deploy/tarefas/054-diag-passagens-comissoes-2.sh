. deploy/lib.sh
# Só leitura: OFs com passagem em out/2026 x situação da OF (comissões só contam CONCLUÍDAS no mês)
sql -At -F ' | ' <<'SQL'
with pm as (select distinct of_id from public.passagens_maquina where data_passagem >= '2026-10-01' and data_passagem < '2026-11-01'),
x as (select o.*, coalesce(o.data_conclusao::date, o.data_faturamento::date, o.created_at::date) dr,
  (select array_agg(distinct p.maquina) from public.passagens_maquina p where p.of_id = o.id) passou
  from public.ofs o where o.id in (select of_id from pm))
select case when deleted_at is not null or status ilike '%cancel%' then '3 cancelada/excluida'
 when status ilike '%conclu%' and dr >= '2026-10-01' and dr < '2026-11-01' then '1 concluida em OUT (entra em comissoes)'
 when status ilike '%conclu%' and dr < '2026-10-01' then '4 concluida ANTES de out'
 when status ilike '%conclu%' then '5 concluida DEPOIS'
 when coalesce(jsonb_array_length(case when jsonb_typeof(fluxo_maquinas::jsonb)='array' then fluxo_maquinas::jsonb end),0) <= coalesce(array_length(passou,1),0) then '2a ABERTA mas ja passou por todas as maquinas do fluxo'
 else '2b ABERTA, ainda falta maquina' end s, count(*), round(sum(coalesce(valor_total,0))::numeric,2)
from x group by 1 order by 1;
SQL
echo "## status das abertas que ja passaram por tudo (amostra 15: of, cliente, entrega, fluxo, passou, valor)"
sql -At -F ' | ' <<'SQL'
select o.of, left(coalesce(o.clinome,o.cliente_nome),25), o.ent, o.fluxo_maquinas, (select string_agg(distinct p.maquina, ',') from public.passagens_maquina p where p.of_id=o.id), o.valor_total
from public.ofs o where o.deleted_at is null and o.status not ilike '%conclu%' and o.status not ilike '%cancel%'
and o.id in (select of_id from public.passagens_maquina where data_passagem >= '2026-10-01' and data_passagem < '2026-11-01')
order by o.valor_total desc nulls last limit 15;
SQL
echo "## abertas com passagem (qualquer mes) total"
sql -At -F ' | ' -c "select count(*), round(sum(valor_total)::numeric,2) from public.ofs o where o.deleted_at is null and o.status not ilike '%conclu%' and o.status not ilike '%cancel%' and exists (select 1 from public.passagens_maquina p where p.of_id=o.id);"
