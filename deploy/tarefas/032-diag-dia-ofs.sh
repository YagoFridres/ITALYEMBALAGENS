. deploy/lib.sh
echo "== OF teste 4371"
sql -At -c "select id, of, numero, cliente, produto, status, created_at from public.ofs where of::text='4371' or numero::text='4371';"
echo "== dia das OFs abertas"
sql -At -c "select dia, count(*) from public.ofs where coalesce(status,'') !~* 'conclu|cancel' and deleted_at is null group by 1 order by 2 desc limit 5;"
echo "== cron jobs"
sql -At -c "select jobid, schedule, left(command,200) from cron.job;" 2>&1 | head
echo "== funções/triggers que mexem em dia"
sql -At -c "select p.proname, left(regexp_replace(pg_get_functiondef(p.oid),'\s+',' ','g'),300) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and pg_get_functiondef(p.oid) ~* 'dia\s*=\s*(current_date|now|hoje)';" 2>&1 | head
sql -At -c "select tgname, tgrelid::regclass from pg_trigger where not tgisinternal and tgrelid='public.ofs'::regclass;"
echo "== ultimos pedidos (created_at vs dia)"
sql -At -c "select of, dia, created_at::date, updated_at from public.ofs order by created_at desc limit 5;"
sql -At -c "select of, dia, created_at::date, updated_at from public.ofs where of::text in ('4215','4114','3976');"
echo "== colunas de data"
sql -At -c "select column_name from information_schema.columns where table_schema='public' and table_name='ofs' and (column_name ~* 'dat|dia|pedido') order by 1;" | tr '\n' ' '
