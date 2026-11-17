#!/bin/bash
# Diagnóstico (somente leitura): quantas facas existiam em cada backup — 17/11
for f in $(ls /opt/pcp-pro/backups/*.dump | sort); do
  n=$(pg_restore -a -t facas_estoque -f - "$f" 2>/dev/null | awk '/^COPY /{c=1;next} /^\\\.$/{c=0} c' | wc -l)
  echo "$(basename $f): $n facas"
done
