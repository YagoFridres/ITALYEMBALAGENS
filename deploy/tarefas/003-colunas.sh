# Lista colunas das tabelas principais e apaga diagnósticos antigos (tinham variáveis do pm2)
. deploy/lib.sh
rm -f /opt/pcp-pro/tarefas-log/001-diagnostico.sh.log /opt/pcp-pro/tarefas-log/002-diagnostico.sh.log
for t in ofs clientes orcamentos compras_papelao comissoes maquinas passagens_maquina chapas_estoque_v2 vendedores usuarios; do
  echo "== $t"; sql -At -c "select string_agg(column_name||':'||data_type, ', ' order by ordinal_position) from information_schema.columns where table_schema='public' and table_name='$t';"
done
echo "== todas as tabelas"; sql -At -c "select string_agg(table_name, ', ' order by table_name) from information_schema.tables where table_schema='public';"
