. deploy/lib.sh
# Padroniza cidade/UF de TODOS os clientes (ativos e inativos) pelas cidades do mapa de clientes.
# Backup já feito em bkp_clientes_cidade_20261029 (tarefa 061).
sql <<'SQL'
create or replace function pg_temp.nz(t text) returns text language sql immutable as $$
  select trim(regexp_replace(upper(translate(coalesce(t,''),
    'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
    'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC')), '[^A-Z0-9]+', ' ', 'g'))
$$;
create temp table cli as
select c.id, c.nome, c.cidade, c.uf,
       pg_temp.nz(regexp_replace(trim(c.cidade), '[\s\-/,(]+(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\)?\s*$', '', 'i')) as n,
       upper(coalesce(substring(trim(c.cidade) from '(?i)[\s\-/,(]+(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\)?\s*$'), nullif(trim(c.uf),''))) as uf_inf
from public.clientes c where coalesce(trim(c.cidade),'') <> '';
update cli set n = case n when 'CHAEPECO' then 'CHAPECO' when 'SOA MIGUEL DO OESTE' then 'SAO MIGUEL DO OESTE' when 'FREDERICO WESPHALEN' then 'FREDERICO WESTPHALEN' else n end;
create temp table cid as select nome, uf, pg_temp.nz(nome) n from public.cidades;
create temp table casa as
select cli.id, cli.nome cliente, cli.cidade de_cidade, cli.uf de_uf, m.nome para_cidade, m.uf para_uf
from cli
join lateral (
  select cid.nome, cid.uf, count(*) over () qt from cid
  where cid.n = cli.n and (cli.uf_inf is null or cli.uf_inf = cid.uf
        or not exists (select 1 from cid c2 where c2.n = cli.n and c2.uf = cli.uf_inf))
) m on m.qt = 1;
\echo '== vão mudar =='
select count(*) from casa where de_cidade is distinct from para_cidade or upper(coalesce(de_uf,'')) is distinct from para_uf;
update public.clientes c set cidade = casa.para_cidade, uf = casa.para_uf
from casa where c.id = casa.id and (c.cidade is distinct from casa.para_cidade or upper(coalesce(c.uf,'')) is distinct from casa.para_uf);
\echo '== sem cidade correspondente no mapa (ficaram como estavam) =='
select cli.nome || ' | ' || cli.cidade || ' | ' || coalesce(cli.uf,'') from cli where cli.id not in (select id from casa) order by 1;
\echo '== conferência: clientes com cidade fora do mapa =='
select count(*) from public.clientes c where coalesce(trim(c.cidade),'') <> '' and not exists (select 1 from public.cidades x where x.nome = c.cidade and x.uf = upper(coalesce(c.uf,'')));
SQL
