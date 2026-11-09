#!/bin/bash
# Diagnóstico (somente leitura): erros recentes do servidor em entradas/saídas de chapas
source "$(dirname "$0")/../lib.sh"
echo "== pm2 erros (últimas linhas relacionadas) =="
for f in /root/.pm2/logs/*error*.log /root/.pm2/logs/*out*.log; do
  [ -f "$f" ] || continue
  echo "--- $f"
  tail -n 4000 "$f" | grep -iE "chapa|moviment|entrada|saida|saída|estoque" | grep -iE "erro|error|fail|falh|exception|violat|null value|denied|500|400|409" | tail -n 40
done
echo "== movimentos v2 de hoje =="
sql -c "select tipo, count(*), max(created_at) from chapas_estoque_movimentos_v2 where created_at > now() - interval '1 day' group by tipo;" 2>&1 | head -20
echo "== ultimos 15 movimentos =="
sql -c "select created_at, tipo, delta, origem, reverted, left(coalesce(obs,''),40) obs from chapas_estoque_movimentos_v2 order by created_at desc limit 15;" 2>&1 | head -30
