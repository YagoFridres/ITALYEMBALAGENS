. deploy/lib.sh
sed -n '/-- Tempos Reais: a tela/,$p' deploy/fixes-banco.sql | sql
recarregar_api
sql -At -c "select column_name||':'||data_type from information_schema.columns where table_schema='public' and table_name='tempos_reais' order by ordinal_position;"
sql -At -c "select count(*) from public.tempos_reais;"
