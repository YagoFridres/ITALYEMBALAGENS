. deploy/lib.sh
for t in compras_chapas compras_chapas_itens; do echo "== $t"; sql -At -c "select string_agg(column_name, ',' order by ordinal_position) from information_schema.columns where table_schema='public' and table_name='$t';"; done
echo "== itens"; sql -At -c "select c.numero_compra, i.largura, i.comprimento, i.quantidade, i.area_m2, i.valor_m2, i.valor_total from compras_chapas c join compras_chapas_itens i on i.compra_id=c.id order by c.numero_compra;" 2>&1 | head -30
