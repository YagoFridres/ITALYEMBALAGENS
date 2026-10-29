. deploy/lib.sh
# cópia de segurança de cidade/uf/ramo antes de padronizar as cidades dos clientes
sql -c "create table if not exists public.bkp_clientes_cidade_20261029 as select id, nome, cidade, uf, ramo, now() as copiado_em from public.clientes;"
sql -At -c "select count(*) from public.bkp_clientes_cidade_20261029;"
