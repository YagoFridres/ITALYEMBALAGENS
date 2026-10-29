# O PostgREST devolvia no máximo 1000 linhas por consulta; ~94 consultas do sistema pedem mais
# (relatórios, listas) e vinham cortadas sem aviso. Sobe o limite para 100000.
set -e
. /opt/pcp-pro/app/deploy/lib.sh
cd /opt/pcp-pro/banco
echo "== serviço rest no compose =="
grep -n -A25 '^  rest:' docker-compose.yml | grep -n 'PGRST\|image\|environment' || true
echo "== valor atual =="
grep -n 'MAX_ROWS' docker-compose.yml .env || echo "(nenhum MAX_ROWS definido)"
cp docker-compose.yml docker-compose.yml.bak-$(date +%s)
if grep -q 'PGRST_DB_MAX_ROWS' docker-compose.yml; then
  sed -i 's/PGRST_DB_MAX_ROWS:.*/PGRST_DB_MAX_ROWS: "100000"/' docker-compose.yml
else
  # acrescenta logo depois da linha PGRST_DB_URI (ou PGRST_DB_SCHEMAS) do serviço rest
  awk 'BEGIN{done=0} {print} (!done && $0 ~ /PGRST_DB_(URI|SCHEMAS):/){ match($0,/^ */); printf "%sPGRST_DB_MAX_ROWS: \"100000\"\n", substr($0,1,RLENGTH); done=1 }' docker-compose.yml > /tmp/dc.yml && mv /tmp/dc.yml docker-compose.yml
fi
grep -n 'PGRST_DB_MAX_ROWS' docker-compose.yml
$DC up -d rest
sleep 6
set -a; . /opt/pcp-pro/banco/.env; set +a
echo "== teste: linhas devolvidas com limit=5000 =="
curl -s -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" -H "Prefer: count=exact" "http://127.0.0.1:8000/rest/v1/ofs?select=id&limit=5000" -o /tmp/ofs.json -D /tmp/h.txt
grep -i content-range /tmp/h.txt || true
python3 -c "import json;print('linhas:',len(json.load(open('/tmp/ofs.json'))))" 2>/dev/null || node -e "console.log('linhas:',require('/tmp/ofs.json').length)"
