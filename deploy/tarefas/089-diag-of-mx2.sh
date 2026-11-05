. deploy/lib.sh
echo "== out 15:14-15:40"
grep -hE "^2026-11-05T15:(1[4-9]|[23][0-9]):" /opt/pcp-pro/app-out-0.log | grep -viE "AMOSTRAS|heartbeat|presence" | tail -n 120 | cut -c1-260
echo "== err 15:14-15:40"
grep -hE "^2026-11-05T15:(1[4-9]|[23][0-9]):" /opt/pcp-pro/app-err-0.log | grep -viE "AMOSTRAS|PASSAGENS-MAQUINA\] insert tentativa" | tail -n 80 | cut -c1-260
echo "== nginx POST ofs"
for f in /var/log/nginx/*access*.log; do grep -hE "POST /api/ofs" "$f" 2>/dev/null | tail -n 10 | cut -c1-220; done
echo "== of_seq / sequence"
sql -c "select max(numero::int) from ofs where numero ~ '^[0-9]+$';"
