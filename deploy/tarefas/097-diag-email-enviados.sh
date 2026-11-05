. deploy/lib.sh
grep -hE "EMAIL|enviados|compras-chapas/.*/enviar" /opt/pcp-pro/app-out-0.log /opt/pcp-pro/app-err-0.log | grep -E "^2026-11-05T1[6-9]" | tail -n 30 | cut -c1-300
