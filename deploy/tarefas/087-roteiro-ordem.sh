. deploy/lib.sh
# Roteiro de entrega: ordem das cidades dentro de cada dia (05/11)
sql -c "alter table public.roteiro_entrega add column if not exists ordem integer not null default 0;"
sql -c "with x as (select id, row_number() over (partition by dia_semana order by cidade) as rn from public.roteiro_entrega) update public.roteiro_entrega r set ordem = x.rn from x where x.id = r.id and coalesce(r.ordem,0) = 0;"
recarregar_api
sql -c "select dia_semana, count(*) from public.roteiro_entrega group by 1 order by 1;"
sql -c "alter table public.ofs add column if not exists cidade_entrega text;"
recarregar_api
sql -c "select count(*) filter (where cidade_entrega is not null) as com_cidade from public.ofs;"
