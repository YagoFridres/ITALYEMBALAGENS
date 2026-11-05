. deploy/lib.sh
ls -la /var/log/nginx/ 2>/dev/null | head
echo "== nginx 4624/ofs POST"
for f in /var/log/nginx/*.log; do grep -hE "POST /api/ofs(\?| )" "$f" 2>/dev/null | tail -n 15 | cut -c1-220; done
echo "== app logs: 4624 / RUIZ / OFS POST"
grep -hE "4624|RUIZ|\[OFS?\]|POST /api/ofs|duplicat|numero_final|of_seq" /opt/pcp-pro/app-out-0.log /opt/pcp-pro/app-err-0.log | grep -E "^2026-11-05" | grep -v "concluir operador" | tail -n 60 | cut -c1-300
