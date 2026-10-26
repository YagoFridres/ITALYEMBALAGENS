. deploy/lib.sh
for t in estados cidades ramos_atividade fornecedores; do echo "== $t"; sql -At -c "select string_agg(column_name||':'||data_type, ', ' order by ordinal_position) from information_schema.columns where table_schema='public' and table_name='$t';"; sql -At -c "select count(*) from $t"; done
echo "== clientes cidade/uf/ramo distintos"; sql -At -c "select count(distinct cidade), count(distinct uf), count(distinct ramo), count(*) filter (where coalesce(cidade,'')=''), count(*) from clientes;"
