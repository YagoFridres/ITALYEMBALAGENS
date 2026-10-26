. deploy/lib.sh
# Espera a cópia de dados (sync-dados) terminar e reaplica as correções de banco.
L=/opt/pcp-pro/tarefas-log/sync-dados.log
for i in $(seq 1 170); do
  if grep -q " fim" "$L" 2>/dev/null; then break; fi
  sleep 10
done
grep " fim\| início" "$L" | tail -2
sql -v ON_ERROR_STOP=0 < deploy/fixes-banco.sql 2>&1 | grep -v NOTICE | tail -5
recarregar_api
sql -At -c "select 'ofs='||count(*)||' max='||max(numero) from ofs;"
sql -At -c "select count(*) from information_schema.tables where table_schema='public' and table_name='pedidos_recorrentes';"
