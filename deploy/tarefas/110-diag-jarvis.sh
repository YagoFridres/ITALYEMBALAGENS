#!/bin/bash
# Diagnóstico (leitura): erros do Jarvis nos logs do pm2
source "$(dirname "$0")/../lib.sh"
grep -n "log\|out_file\|error_file" /root/migracao-hostgator/ecosystem.config.js 2>/dev/null | head
for f in $(pm2 jlist 2>/dev/null | grep -o '"pm_\(out\|err\)_log_path":"[^"]*"' | cut -d'"' -f4 | sort -u) /root/.pm2/logs/*.log /home/*/.pm2/logs/*.log; do
  [ -f "$f" ] || continue; echo "--- $f"; grep -a -n "JARVIS\|CALLJARVIS" "$f" | tail -n 25
done
