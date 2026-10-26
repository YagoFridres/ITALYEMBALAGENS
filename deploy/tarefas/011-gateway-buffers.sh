# PostgREST devolve a URL inteira no cabeçalho Content-Location; com listas grandes de ids o
# nginx (buffer padrão 4-8k) respondia 502 "upstream sent too big header". Aumenta os buffers.
set -e
F=/opt/pcp-pro/banco/nginx-gateway.conf
cp "$F" "$F.bak-$(date +%s)"
grep -q 'proxy_buffer_size' "$F" || sed -i 's/large_client_header_buffers 8 256k;/large_client_header_buffers 8 256k;\n  proxy_buffer_size 256k;\n  proxy_buffers 16 256k;\n  proxy_busy_buffers_size 512k;/' "$F"
grep -n 'buffer' "$F"
cd /opt/pcp-pro/banco && docker compose exec -T gateway nginx -t && docker compose restart gateway
sleep 3
. /opt/pcp-pro/app/deploy/lib.sh
set -a; . /opt/pcp-pro/banco/.env; set +a
for n in 150 900; do
  ids=$(sql -At -c "select string_agg(id::text, ',') from (select id from ofs limit $n) s")
  echo "n=$n -> $(curl -s -o /dev/null -w '%{http_code}' -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" "http://127.0.0.1:8000/rest/v1/ofs?select=id&id=in.($ids)")"
done
