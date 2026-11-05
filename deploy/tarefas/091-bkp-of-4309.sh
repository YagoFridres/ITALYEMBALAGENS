. deploy/lib.sh
B=$(ls -1 /opt/pcp-pro/backups/banco_2026-11-05_*.dump 2>/dev/null | tail -1)
[ -z "$B" ] && B=$(find / -xdev -name "banco_2026-11-05_*.dump" 2>/dev/null | head -1)
echo "dump: $B"
sql -c "drop table if exists _bkp_ofs_4309; create table _bkp_ofs_4309 (like ofs);"
# extrai só a linha da OF 4309 do COPY de ofs
$DC exec -T db pg_restore -a -t ofs -f - < "$B" 2>/dev/null | awk '/^COPY public.ofs /{p=1; print; next} p&&/^\\\.$/{print; exit} p&&/a8ceff29-f636-4ad3-9185-90edab2e1652/{print}' > /tmp/_of4309.sql
wc -l /tmp/_of4309.sql
H=$(head -1 /tmp/_of4309.sql | sed 's/^COPY public.ofs /COPY _bkp_ofs_4309 /')
{ echo "$H"; sed -n '2,$p' /tmp/_of4309.sql; } | sql
echo "== diferenças (backup 06:25 x agora)"
sql -At -c "select key || ' | antes: ' || left(coalesce(b.value::text,'null'),160) || ' | agora: ' || left(coalesce(a.value::text,'null'),160) from jsonb_each((select to_jsonb(x) from _bkp_ofs_4309 x)) b join jsonb_each((select to_jsonb(o) from ofs o where id='a8ceff29-f636-4ad3-9185-90edab2e1652')) a using(key) where a.value is distinct from b.value;"
rm -f /tmp/_of4309.sql
