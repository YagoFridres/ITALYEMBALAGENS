. deploy/lib.sh
# A tarefa 024 falhou no meio (chave única) e apagou as chapas antigas sem cópia.
# 1) cópia de segurança das chapas antigas a partir do backup das 15:30 (antes-sync-*.dump)
D=$(ls -1t /opt/pcp-pro/backups/antes-sync-*.dump | head -1); echo "backup usado: $D"
sql -c "create table if not exists public.chapas_estoque_v2_bkp_20261026 (like public.chapas_estoque_v2 including defaults);"
if [ "$(sql -At -c 'select count(*) from public.chapas_estoque_v2_bkp_20261026;')" = "0" ]; then
  $DC exec -T db pg_restore -f - --data-only -t chapas_estoque_v2 < "$D" | sed '0,/^COPY public\.chapas_estoque_v2 /s//COPY public.chapas_estoque_v2_bkp_20261026 /' | $DC exec -T db psql -U postgres -d postgres -q
fi
sql -At -c "select 'cópia das chapas antigas: '||count(*) from public.chapas_estoque_v2_bkp_20261026;"
# 2) estoque novo = planilha
sql < deploy/estoque-planilha-20261026.sql
recarregar_api
sql -At -c "select count(*)||' chapas · '||sum(coalesce(quantidade_atual,quantidade,0))::bigint||' unidades · R\$ '||round(sum(coalesce(valor_total,0)),2) from public.chapas_estoque_v2;"
