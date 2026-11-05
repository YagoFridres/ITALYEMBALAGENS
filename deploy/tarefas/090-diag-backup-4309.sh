. deploy/lib.sh
echo "== backups"
ls -la /opt/pcp-pro/backups /opt/pcp-pro/banco/backups /root/backups /var/backups/pcp* 2>/dev/null | tail -n 20
find / -xdev \( -name "*.sql.gz" -o -name "*.dump" -o -name "*.sql" \) -size +1M -mtime -3 2>/dev/null | head -n 20
echo "== tabelas de historico"
sql -At -c "select table_name from information_schema.tables where table_schema='public' and (table_name ilike '%hist%' or table_name ilike '%log%' or table_name ilike '%audit%' or table_name ilike '%evento%');"
echo "== audit_log 4309"
sql -c "select operacao, created_at, left(dados_antes::text,300) from audit_log where registro_id='a8ceff29-f636-4ad3-9185-90edab2e1652' order by created_at desc limit 5;" 2>&1 | head -20
