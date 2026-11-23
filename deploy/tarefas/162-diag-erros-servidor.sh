#!/usr/bin/env bash
# 23/11: varredura — erros do servidor das últimas horas (agrupados, sem dados pessoais)
echo "== erros (pm2) agrupados"
pm2 logs pcp-pro --err --lines 3000 --nostream 2>/dev/null | sed -E 's/[0-9a-f]{8}-[0-9a-f-]{27}/<id>/g; s/[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:.]+Z?//g; s/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+/<email>/g' | grep -v "^\s*$" | cut -c1-180 | sort | uniq -c | sort -rn | head -40
echo fim
