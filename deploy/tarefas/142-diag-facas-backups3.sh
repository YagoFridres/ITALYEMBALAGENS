#!/bin/bash
# Diagnóstico (somente leitura): quantas facas (e clientes, para conferir) existiam em cada backup — 17/11
source "$(dirname "$0")/../lib.sh"
conta() { $DC exec -T db pg_restore -a -t "$2" -f - < "$1" 2>/dev/null | awk '/^COPY /{c=1;next} /^\\\.$/{c=0} c' | wc -l; }
for f in $(ls /opt/pcp-pro/backups/*.dump | sort); do
  echo "$(basename $f): clientes=$(conta $f clientes) facas_estoque=$(conta $f facas_estoque)"
done
