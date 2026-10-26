# Confere Comissões de out/2026 por SQL: OFs concluídas, data = COALESCE(faturamento, conclusão, dia, criação),
# vendedor = vendedor ATUAL do cadastro do cliente (fallback: vendedor da OF)
. deploy/lib.sh
sql -c "
with b as (
  select o.*, coalesce(o.data_faturamento::date, o.data_conclusao::date, o.dia, o.created_at::date) as dref,
         coalesce(nullif(c.vendedor_id,''), nullif(o.vendedor_id,''), nullif(o.\"vendId\",''), o.vendid) as vend
  from ofs o left join clientes c on c.id::text = coalesce(o.cli_id, o.cliente_id::text)
  where o.deleted_at is null and lower(o.status) like 'conclu%' and upper(coalesce(o.clinome,'')) not like '%TESTE%'
)
select coalesce(v.nome,'(sem)') vendedor, count(*) ofs, round(sum(coalesce(nullif(b.valor_total,0), nullif(b.valor_venda,0), b.total, 0)),2) total
from b left join vendedores v on v.id::text=b.vend
where b.dref between '2026-10-01' and '2026-10-31' group by 1 order by 3 desc;"
