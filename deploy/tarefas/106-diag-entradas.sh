#!/bin/bash
# Diagnóstico (somente leitura): tentativas de entrada/saída de chapas hoje
source "$(dirname "$0")/../lib.sh"
echo "== nginx =="
for f in /var/log/nginx/*access*.log /var/log/nginx/*.log; do [ -f "$f" ] && grep -hE "chapas/(entrada|saida)-lote|chapas_estoque_movimentos|chapas_estoque/[^ ]*/movimento" "$f" | grep -v "GET" | tail -n 40 | awk '{print $1,$4,$6,$7,$9}'; done | sort -u | tail -n 60
echo "== pm2 =="
ls -la /root/.pm2/logs 2>/dev/null | tail -n 10
for f in $(ls -t /root/.pm2/logs/*.log 2>/dev/null | head -4); do echo "--- $f"; grep -hiE "entrada-lote|saida-lote|entrada em lote|saida em lote|chapas_estoque_movimentos" "$f" | tail -n 25; done
echo "== audit_log hoje =="
sql -c "select created_at, left(coalesce(usuario::text,''),25) usuario, left(coalesce(acao::text,''),40) acao from audit_log where created_at > now() - interval '10 hour' and (acao::text ilike '%chapa%' or acao::text ilike '%estoque%' or tabela::text ilike '%chapa%') order by created_at desc limit 30;" 2>&1 | head -40
