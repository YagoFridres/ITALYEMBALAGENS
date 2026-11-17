#!/bin/bash
# Diagnóstico (somente leitura): as facas foram apagadas ou nunca vieram? — 17/11
source "$(dirname "$0")/../lib.sh"
echo "== tabelas de log com 'faca' =="
for t in $(sql -At -c "select table_name from information_schema.tables where table_schema='public' and (table_name ilike '%log%' or table_name ilike '%audit%' or table_name ilike '%hist%')"); do
  cols=$(sql -At -c "select string_agg(column_name,',') from information_schema.columns where table_name='$t' and data_type in ('text','character varying','jsonb')")
  [ -z "$cols" ] && continue
  cond=$(echo "$cols" | tr ',' '\n' | sed "s/.*/\"&\"::text ilike '%faca%'/" | paste -sd' or ')
  n=$(sql -At -c "select count(*) from public.$t where $cond" 2>/dev/null)
  [ "${n:-0}" != "0" ] && echo "-- $t: $n" && sql -c "select * from public.$t where $cond order by 1 desc limit 5" 2>&1 | cut -c1-300 | head -12
done
echo "== backups / dumps no servidor =="
ls -la /root/*.sql* /root/backup* /root/migracao* /var/backups/pcp* 2>/dev/null | head -20
find / -maxdepth 4 \( -name "*.sql" -o -name "*.sql.gz" -o -name "*.dump" \) -size +100k 2>/dev/null | grep -v -E "^/(proc|sys|usr)" | head -20
