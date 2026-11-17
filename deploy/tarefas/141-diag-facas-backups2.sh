#!/bin/bash
# Conferência do método (somente leitura) — 17/11
f=/opt/pcp-pro/backups/banco_2026-11-17_0625.dump
for t in clientes facas_estoque facas facas_categorias cliches_estoque; do
  n=$(pg_restore -a -t "$t" -f - "$f" 2>/dev/null | awk '/^COPY /{c=1;next} /^\\\.$/{c=0} c' | wc -l)
  echo "$t: $n"
done
pg_restore -l "$f" 2>/dev/null | grep -i "faca" | head
