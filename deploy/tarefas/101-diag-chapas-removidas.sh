. deploy/lib.sh
sql -c "select b.fornecedor, b.nomenclatura, b.tamanho, coalesce(b.nome_uso,b.nome) nome, coalesce(b.quantidade_atual,b.quantidade) qtd from public.chapas_estoque_v2_bkp_20261106 b where not exists (select 1 from public.chapas_estoque_v2 c where c.id=b.id);"
