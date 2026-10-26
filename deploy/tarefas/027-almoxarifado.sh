. deploy/lib.sh
sed -n '/-- Almoxarifado: ordens de compra/,$p' deploy/fixes-banco.sql | sql
recarregar_api
sql -At -c "select count(*) from public.almox_ordens;"
