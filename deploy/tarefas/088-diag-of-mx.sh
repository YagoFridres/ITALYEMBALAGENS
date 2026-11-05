. deploy/lib.sh
echo "== OFs MX recentes (inclui excluídas)"
sql -c "select numero, cliente_nome, status, created_at, deleted_at, updated_at from ofs where created_at > now() - interval '3 hours' order by created_at desc limit 15;" 2>&1 | head -40
sql -c "select numero, status, created_at, deleted_at from ofs where (cliente_nome ilike '%MX%') order by created_at desc limit 6;" 2>&1 | head -20
echo "== auditoria / logs de ofs últimas 2h"
sql -c "select tabela, acao, registro_id, created_at, left(coalesce(dados_novos::text,''),200) from auditoria where created_at > now() - interval '2 hours' and tabela ilike '%of%' order by created_at desc limit 30;" 2>&1 | head -60
echo "== app logs desde 18:00Z"
grep -hE "ofs|OF " /opt/pcp-pro/app-out-0.log /opt/pcp-pro/app-err-0.log | grep -E "2026-11-05T1[89]|2026-11-05 1[5-9]" | tail -n 80 | cut -c1-300
echo "== err tail"
tail -n 40 /opt/pcp-pro/app-err-0.log | cut -c1-300
