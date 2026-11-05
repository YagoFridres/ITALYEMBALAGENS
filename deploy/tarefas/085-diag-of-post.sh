. deploy/lib.sh
echo "== nginx: POST/PUT de OFs hoje"
for f in /var/log/nginx/access.log /var/log/nginx/*teste*access*.log; do [ -f "$f" ] && grep -E "05/Nov/2026:(09|1[0-3]):" "$f" | grep -E "\"(POST|PUT|PATCH|DELETE) /api/ofs" | grep -v "/concluir\|/passagem\|/apontamento" | tail -n 60 | cut -c1-260; done
echo "== app-out 09:34-09:44 (sem ruído)"
grep -E "^2026-11-05T09:(3[4-9]|4[0-4])" /opt/pcp-pro/app-out-0.log | grep -viE "CLIENTES\] ofs lidas|GET /api/(ofs|clientes)|lastError: null" | tail -n 120 | cut -c1-300
echo "== app-err 09:34-09:44"
grep -E "^2026-11-05T09:(3[4-9]|4[0-4])" /opt/pcp-pro/app-err-0.log | tail -n 60 | cut -c1-300
