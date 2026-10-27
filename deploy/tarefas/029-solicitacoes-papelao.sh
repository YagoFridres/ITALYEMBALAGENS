. deploy/lib.sh
sed -n '/-- Solicitações de compra de papelão/,$p' deploy/fixes-banco.sql | sql
recarregar_api
sql -At -c "select count(*) from public.papelao_solicitacoes;"
