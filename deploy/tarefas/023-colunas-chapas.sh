. deploy/lib.sh
# diagnóstico: colunas e amostra do estoque de chapas (para importar a planilha do Yago)
for t in chapas_estoque_v2 chapas_estoque; do
  echo "== $t"
  sql -At -c "select column_name||':'||data_type||':'||coalesce(column_default,'') from information_schema.columns where table_schema='public' and table_name='$t' order by ordinal_position;"
  sql -At -c "select count(*) from public.$t;" 2>&1 | head -2
done
sql -At -c "select row_to_json(t) from (select * from public.chapas_estoque_v2 order by random() limit 2) t;" 2>&1 | cut -c1-900
sql -At -c "select categoria, count(*) from public.chapas_estoque_v2 group by 1 order by 2 desc limit 15;" 2>&1
sql -At -c "select qual_cnpj, empresa_vinculada, count(*) from public.chapas_estoque_v2 group by 1,2 order by 3 desc limit 10;" 2>&1
