#!/bin/bash
# Diagnóstico: chama a API do banco direto (PATCH) para ver se a localizacao grava; depois volta ao vazio — 17/11
for f in /opt/pcp-pro/app/.env /opt/pcp-pro/app.env /root/migracao-hostgator/app.env /opt/pcp-pro/.env; do [ -f "$f" ] && { set -a; . "$f"; set +a; echo "env: $f"; }; done
U="${SUPABASE_URL:-http://127.0.0.1:8000}"; K="${SUPABASE_SERVICE_KEY:-${SUPABASE_SERVICE_ROLE_KEY:-$SUPABASE_KEY}}"
[ -z "$K" ] && { echo "sem chave no env"; pm2 jlist 2>/dev/null | python3 -c "import sys,json;[print(k) for p in json.load(sys.stdin) for k in p['pm2_env'].get('env',{}) if 'SUPA' in k]"; exit 0; }
ID=1484e63b-bb26-4a07-ba4c-63ee9913c0aa
curl -s -X PATCH "$U/rest/v1/facas_estoque?id=eq.$ID" -H "apikey: $K" -H "Authorization: Bearer $K" -H "Content-Type: application/json" -H "Prefer: return=representation" -d '{"localizacao":"TESTE API"}' | python3 -c "import sys,json;d=json.load(sys.stdin);print(d if isinstance(d,dict) else [x.get('localizacao') for x in d])"
curl -s -X PATCH "$U/rest/v1/facas_estoque?id=eq.$ID" -H "apikey: $K" -H "Authorization: Bearer $K" -H "Content-Type: application/json" -H "Prefer: return=minimal" -d '{"localizacao":""}' -o /dev/null -w "volta: %{http_code}\n"
ls /root/.pm2/logs/ | head
