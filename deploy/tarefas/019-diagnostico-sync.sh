. deploy/lib.sh
echo "== processos do sync"; ps -eo pid,etimes,stat,cmd | grep -E "sync-dados|pg_dump|pg_restore|02-copiar|03-copiar|psql" | grep -v grep | cut -c1-160
echo "== backups"; ls -lh /opt/pcp-pro/backups 2>&1 | tail -4
echo "== disco"; df -h / | tail -1
echo "== locks/esperas no banco"; sql -At -c "select pid, state, wait_event_type, wait_event, now()-query_start, left(query,90) from pg_stat_activity where datname='postgres' and state<>'idle' order by query_start;"
echo "== tamanho do banco"; sql -At -c "select pg_size_pretty(pg_database_size('postgres'));"
echo "== log sync"; tail -5 /opt/pcp-pro/tarefas-log/sync-dados.log
