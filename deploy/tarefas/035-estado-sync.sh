. deploy/lib.sh
systemctl is-enabled pcp-sync-ofs.timer; systemctl is-active pcp-sync-ofs.timer
systemctl list-timers pcp-sync-ofs.timer --no-pager | head -3
ls -la /etc/pcp-pro/ 2>&1 | sed 's/sync-origem.*/sync-origem (existe)/'
cat /opt/pcp-pro/sync-estado/*.wm 2>/dev/null
tail -5 /opt/pcp-pro/tarefas-log/sync-ofs.log
sql -At -c "select count(*) from public.sync_ignorar;"
sql -At -c "select count(*) from public.almox_ordens;" 2>&1
sql -At -c "select count(*) from public.ofs where coalesce(status,'') !~* 'conclu|cancel' and deleted_at is null;"
