. deploy/lib.sh
# Compara (só leitura) as OFs de outubro/2026 do Supabase (sistema antigo) com o banco de teste
SEG=/etc/pcp-pro/sync-origem
[ -f "$SEG" ] || { echo "sem conexão guardada"; exit 0; }
CS=$(head -n1 "$SEG")
src() { docker run --rm -i -e PGCONNECT_TIMEOUT=20 postgres:17 psql "$CS" -At -F ' | ' -v ON_ERROR_STOP=1 -c "$1" </dev/null; }
DR="coalesce(data_conclusao::date, data_faturamento::date, created_at::date)"
F="deleted_at is null and status ilike '%conclu%' and status not ilike '%cancel%' and $DR >= '2026-10-01' and $DR < '2026-11-01'"
echo "## ORIGEM concluidas out (count, soma)"; src "select count(*), round(sum(coalesce(valor_total,0))::numeric,2) from public.ofs where $F;"
echo "## TESTE  concluidas out (count, soma)"; sql -At -F ' | ' -c "select count(*), round(sum(coalesce(valor_total,0))::numeric,2) from public.ofs where $F;"
echo "## ORIGEM total linhas / max updated_at / max created_at"; src "select count(*), max(updated_at), max(created_at) from public.ofs;"
echo "## TESTE  total linhas / max updated_at / max created_at"; sql -At -F ' | ' -c "select count(*), max(updated_at), max(created_at) from public.ofs;"
echo "## ORIGEM concluidas por dia (out 20+)"; src "select data_conclusao::date, count(*), round(sum(coalesce(valor_total,0))::numeric,2) from public.ofs where $F and data_conclusao >= '2026-10-20' group by 1 order by 1;"
echo "## TESTE  concluidas por dia (out 20+)"; sql -At -F ' | ' -c "select data_conclusao::date, count(*), round(sum(coalesce(valor_total,0))::numeric,2) from public.ofs where $F and data_conclusao >= '2026-10-20' group by 1 order by 1;"
echo "## ORIGEM: OFs alteradas depois de 27/10 12:00 sem updated_at novo (status/conclusao recentes)"; src "select count(*) from public.ofs where data_conclusao >= '2026-10-27' and coalesce(updated_at, created_at) < '2026-10-27 12:30+00';"
echo "## ids concluidos em out na ORIGEM que no TESTE nao estao concluidos (amostra)"
src "select id from public.ofs where $F;" | sort > /tmp/orig_ids.txt
sql -At -c "select id from public.ofs where $F;" | sort > /tmp/test_ids.txt
echo "so na origem: $(comm -23 /tmp/orig_ids.txt /tmp/test_ids.txt | wc -l) | so no teste: $(comm -13 /tmp/orig_ids.txt /tmp/test_ids.txt | wc -l)"
for id in $(comm -23 /tmp/orig_ids.txt /tmp/test_ids.txt | head -5); do echo "origem: $(src "select of, status, data_conclusao, updated_at from public.ofs where id='$id';") || teste: $(sql -At -F ' | ' -c "select of, status, data_conclusao, updated_at from public.ofs where id='$id';")"; done
rm -f /tmp/orig_ids.txt /tmp/test_ids.txt
unset CS
