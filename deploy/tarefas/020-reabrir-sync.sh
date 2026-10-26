# Limpa a cópia de dados que ficou parada e reabre o formulário (agora a cópia roda em unidade própria)
pkill -f "deploy/sync-dados.sh" 2>/dev/null || true
for p in $(ps -eo pid,stat,etimes,args | awk '$2 ~ /^T/ && $4 ~ /docker/ && $3 > 600 {print $1}'); do echo "encerrando processo parado $p"; kill -CONT $p 2>/dev/null; kill $p 2>/dev/null; done
pm2 describe pcp-pro >/dev/null 2>&1 && pm2 start pcp-pro >/dev/null 2>&1 || true
ps -eo pid,stat,etimes,args | grep -E "docker compose|sync-dados" | grep -v grep | cut -c1-120 || true
set -e
SEG=$(head -c 12 /dev/urandom | od -An -tx1 | tr -d ' \n')
P="/sync-$SEG"
F=/etc/caddy/Caddyfile
cp $F $F.bak-sync
if ! grep -q 'reverse_proxy 127.0.0.1:3005' $F; then
  python3 - "$F" "$P" <<'PY'
import sys
f,p=sys.argv[1],sys.argv[2]
s=open(f).read()
s=s.replace("\t# ERP (server.js)", "\thandle "+p+"* {\n\t\treverse_proxy 127.0.0.1:3005\n\t}\n\n\t# ERP (server.js)",1)
open(f,'w').write(s)
PY
else
  sed -i "s#handle /sync-[0-9a-f]*\*#handle $P*#" $F
fi
caddy validate --config $F --adapter caddyfile >/dev/null 2>&1 && systemctl reload caddy
systemctl stop pcp-form-sync 2>/dev/null || true
systemd-run --unit=pcp-form-sync --collect --setenv=HOME=/root --setenv=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin /usr/bin/node /opt/pcp-pro/app/deploy/form-sync.js "$P"
sleep 2
echo "LINK: https://teste.italyembalagens.com.br$P"
grep -n "3005" $F
