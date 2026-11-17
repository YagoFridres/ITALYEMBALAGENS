#!/bin/bash
# Diagnóstico (somente leitura): quais eram as 3 facas no backup de hoje 06:25 — 17/11
source "$(dirname "$0")/../lib.sh"
$DC exec -T db pg_restore -a -t facas_estoque -f - < /opt/pcp-pro/backups/banco_2026-11-17_0625.dump 2>/dev/null | awk '/^COPY /{print;c=1;next} /^\\\.$/{c=0} c' | cut -c1-400
