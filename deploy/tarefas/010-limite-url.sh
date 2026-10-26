# Mede o tamanho máximo de URL aceito pelo PostgREST/gateway (causa dos 502)
. deploy/lib.sh
set -a; . /opt/pcp-pro/banco/.env; set +a
K="$SERVICE_ROLE_KEY"
for n in 50 100 150 200 300 500 900; do
  ids=$(sql -At -c "select string_agg(id::text, ',') from (select id from ofs limit $n) s")
  url="http://127.0.0.1:8000/rest/v1/ofs?select=id&id=in.($ids)"
  code=$(curl -s -o /dev/null -w '%{http_code}' -H "apikey: $K" -H "Authorization: Bearer $K" "$url")
  echo "n=$n len=${#url} via_gateway=$code"
done
echo "== direto no PostgREST (sem nginx)"
RIP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' banco-rest-1)
for n in 150 500 900; do
  ids=$(sql -At -c "select string_agg(id::text, ',') from (select id from ofs limit $n) s")
  code=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $K" "http://$RIP:3000/ofs?select=id&id=in.($ids)")
  echo "n=$n direto=$code"
done
echo "== nginx error log"; docker logs banco-gateway-1 2>&1 | grep -i error | tail -5 | cut -c1-300
echo "== rest log"; docker logs banco-rest-1 2>&1 | tail -8 | cut -c1-300
