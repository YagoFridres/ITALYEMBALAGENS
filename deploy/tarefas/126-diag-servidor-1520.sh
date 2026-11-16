#!/bin/bash
# Diagnóstico (somente leitura): o servidor caiu/reiniciou por volta das 15:20 de 16/11?
echo "== pm2 =="
pm2 jlist 2>/dev/null | python3 -c "import sys,json,datetime; [print(p['name'],'reinicios=',p['pm2_env']['restart_time'],'no_ar_desde=',datetime.datetime.utcfromtimestamp(p['pm2_env'].get('pm_uptime',0)/1000),'UTC mem=',p['monit']['memory']//1048576,'MB') for p in json.load(sys.stdin)]" || true
echo "== pm2.log (hoje) =="
grep -h "2026-11-16" /root/.pm2/pm2.log 2>/dev/null | tail -25 | cut -c1-200
echo "== erros do app (fim) =="
tail -n 400 /root/.pm2/logs/pcp-pro-error*.log 2>/dev/null | grep -i -E "heap|memory|killed|SIGKILL|FATAL|EADDR|uncaught|ECONN|timeout" | tail -15 | cut -c1-200
echo "== caddy 502/503 hoje 17:00-19:00 UTC =="
journalctl -u caddy --since "2026-11-16 17:00" --until "2026-11-16 19:00" --no-pager 2>/dev/null | grep -i -E "dial|refused|502|503|timeout" | cut -c1-220 | tail -15
echo "== memoria/disco =="
free -m | head -3; df -h / | tail -1; uptime
