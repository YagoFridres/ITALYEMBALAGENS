# Diagnóstico geral do servidor de teste
. deploy/lib.sh
echo "== containers"; docker ps --format '{{.Names}}\t{{.Status}}'
echo "== disco/memoria"; df -h / | tail -1; free -m | sed -n 2p
echo "== ultimas OFs"; sql -c "select numero, of, clinome, status, created_at, deleted_at from ofs order by created_at desc limit 8;"
echo "== colunas ofs"; sql -At -c "select count(*) from information_schema.columns where table_schema='public' and table_name='ofs';"
sql -At -c "select column_name from information_schema.columns where table_schema='public' and table_name='ofs' and column_name ilike '%cli%';"
echo "== nomes com TESTE"; sql -c "select count(*) from ofs where upper(coalesce(clinome,'')) like '%TESTE%';"
echo "== event triggers"; sql -c "select evtname from pg_event_trigger;"
echo "== tabelas maiores"; sql -c "select relname, n_live_tup from pg_stat_user_tables order by n_live_tup desc limit 12;"
echo "== gateway conf"; grep -n "client\|buffer\|timeout" /opt/pcp-pro/banco/nginx-gateway.conf
echo "== pm2"; pm2 jlist 2>/dev/null | head -c 600; echo
echo "== crontab"; crontab -l
