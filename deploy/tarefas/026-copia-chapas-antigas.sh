. deploy/lib.sh
# cópia das chapas antigas (estoque de antes da planilha) a partir do backup completo das 09:46
D=/opt/pcp-pro/backups/supabase_2026-10-26_0946.dump
if [ "$(sql -At -c 'select count(*) from public.chapas_estoque_v2_bkp_20261026;')" = "0" ]; then
  $DC exec -T db pg_restore -f - --data-only -n public -t chapas_estoque_v2 < "$D" | sed '0,/^COPY public\.chapas_estoque_v2 /s//COPY public.chapas_estoque_v2_bkp_20261026 /' | $DC exec -T db psql -U postgres -d postgres -q 2>&1 | tail -3
fi
sql -At -c "select 'cópia das chapas antigas: '||count(*) from public.chapas_estoque_v2_bkp_20261026;"
