. deploy/lib.sh
sql <<'SQL'
\echo '== colunas de vendedor em clientes =='
select column_name, data_type from information_schema.columns where table_schema='public' and table_name='clientes' and column_name ilike '%vend%';
\echo '== colunas de vendedor/cliente em ofs =='
select column_name from information_schema.columns where table_schema='public' and table_name='ofs' and (column_name ilike '%vend%' or column_name ilike '%cli%');
\echo '== vendedores =='
select id, nome, codigo, ativo, comissao_pct from public.vendedores order by codigo;
\echo '== clientes: total / com vendedor_id =='
select count(*) total, count(vendedor_id) com_vendedor from public.clientes;
SQL
sql <<'SQL'
\echo '== OFs (nao canceladas/excluidas) com cliente_id e vendedor_id =='
select count(*) ofs, count(cliente_id) com_cli, count(vendedor_id) com_vend from public.ofs where deleted_at is null and coalesce(status,'') not ilike 'cancel%';
\echo '== clientes por qtd de vendedores distintos nas OFs =='
with x as (select cliente_id, count(distinct vendedor_id) nv from public.ofs where deleted_at is null and coalesce(status,'') not ilike 'cancel%' and cliente_id is not null and vendedor_id is not null group by 1)
select nv, count(*) from x group by 1 order by 1;
\echo '== pares de vendedores que se misturam no mesmo cliente =='
with x as (select cliente_id, array_agg(distinct v.nome order by v.nome) vs from public.ofs o join public.vendedores v on v.id::text=o.vendedor_id::text where o.deleted_at is null and coalesce(o.status,'') not ilike 'cancel%' and o.cliente_id is not null group by 1 having count(distinct o.vendedor_id)>1)
select array_to_string(vs,' + ') par, count(*) from x group by 1 order by 2 desc;
\echo '== cliente.vendedor_id x vendedor da ultima OF =='
with u as (select distinct on (cliente_id) cliente_id, vendedor_id from public.ofs where deleted_at is null and coalesce(status,'') not ilike 'cancel%' and cliente_id is not null and vendedor_id is not null order by cliente_id, coalesce(data_conclusao, created_at) desc)
select case when c.vendedor_id is null then 'cliente sem vendedor' when c.vendedor_id::text=u.vendedor_id::text then 'igual' else 'diferente' end s, count(*)
from public.clientes c join u on u.cliente_id::text=c.id::text group by 1;
\echo '== clientes com OFs sem cliente_id (so nome) =='
select count(*) from public.ofs where deleted_at is null and cliente_id is null;
SQL
