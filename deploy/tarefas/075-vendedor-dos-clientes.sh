. deploy/lib.sh
# Grava em cada cliente o vendedor das OFs dele (Yago 03/11): o vendedor com mais OFs do cliente; empate -> o da OF mais recente.
# OFs sem cliente_id entram pelo nome, quando o nome bate com um único cliente. Só vendedores ativos.
sql <<'SQL'
create table if not exists public.bkp_clientes_vendedor_20261103 as select id, nome, vendedor_id, now() copiado_em from public.clientes;
\echo '== backup =='
select count(*) from public.bkp_clientes_vendedor_20261103;
create temp table nomes as
  select upper(trim(regexp_replace(nome,'\s+',' ','g'))) n, min(id::text) id from public.clientes where coalesce(trim(nome),'')<>'' group by 1 having count(*)=1;
create temp table base as
  select coalesce(o.cliente_id::text, nm.id) cli, o.vendedor_id::text vend, coalesce(o.data_conclusao, o.created_at) quando
  from public.ofs o
  join public.vendedores v on v.id::text = o.vendedor_id::text and coalesce(v.ativo,true)
  left join nomes nm on o.cliente_id is null and nm.n = upper(trim(regexp_replace(coalesce(o.cliente_nome, o.clinome, o."cliNome",''),'\s+',' ','g')))
  where o.deleted_at is null and coalesce(o.status,'') not ilike 'cancel%';
create temp table escolha as
  select distinct on (cli) cli, vend, n, ult from (
    select cli, vend, count(*) n, max(quando) ult from base where cli is not null group by 1,2
  ) x order by cli, n desc, ult desc;
\echo '== mudancas (cliente | antes -> depois | OFs do vendedor escolhido) =='
select c.nome || ' | ' || coalesce(va.nome,'(sem)') || ' -> ' || vd.nome || ' | ' || e.n
from escolha e join public.clientes c on c.id::text=e.cli
left join public.vendedores va on va.id::text=c.vendedor_id::text join public.vendedores vd on vd.id::text=e.vend
where c.vendedor_id::text is distinct from e.vend order by c.nome;
update public.clientes c set vendedor_id = e.vend::uuid from escolha e where c.id::text=e.cli and c.vendedor_id::text is distinct from e.vend;
\echo '== clientes por vendedor depois =='
select coalesce(v.nome,'(sem vendedor)') vendedor, count(*) from public.clientes c left join public.vendedores v on v.id=c.vendedor_id group by 1 order by 2 desc;
SQL
recarregar_api
