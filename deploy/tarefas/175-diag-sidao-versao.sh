#!/usr/bin/env bash
# 26/11: qual versão/aparelho/empresa o usuário Sidao usa (só leitura)
source deploy/lib.sh
D=$(dirname "$(find / -xdev -name clientes-diag.ndjson -path '*/.dbg/*' 2>/dev/null | head -1)")
echo "pasta: $D"; ls -la "$D" 2>/dev/null | head
for f in "$D"/*.ndjson; do echo "== $f"; grep -i "sid" "$f" | tail -8 | cut -c1-400; done
echo "== usuario"
sql -c "select nome, perfil, ativo, left(coalesce(emp_id::text,''),10) emp, updated_at from usuarios where nome ilike '%sid%';" 2>&1 | head
echo "== ultimas requisicoes do estoque com empId (log)"
pm2 logs pcp-pro --out --lines 20000 --nostream 2>/dev/null | grep -i "chapas_estoque" | grep -io "empId=[A-Za-z0-9-]*" | sort | uniq -c | head
