. deploy/lib.sh
sql -c "alter table public.produtos_cadastro add column if not exists valor_unitario numeric;"
sql -c "select column_name from information_schema.columns where table_schema='public' and table_name='produtos_cadastro' order by ordinal_position;"
sql -c "select column_name from information_schema.columns where table_schema='public' and table_name='ofs' and column_name in ('produto','prodDesc','descricao','larg','comp','largura','comprimento','valor_unitario','preco','cores_impressao','itens','qtd','qtd_produzida','dia','of');"
recarregar_api
