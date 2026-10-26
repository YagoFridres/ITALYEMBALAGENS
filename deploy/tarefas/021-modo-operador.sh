. deploy/lib.sh
# Tabelas do modo operador e da sequência manual das OFs por máquina
sed -n '/-- Modo operador/,$p' deploy/fixes-banco.sql | sql
recarregar_api
sql -At -c "select table_name||'.'||column_name||':'||data_type from information_schema.columns where table_schema='public' and table_name in ('tempos_reais','producao_sessoes','sequenciamento_manual') order by table_name, ordinal_position;"
