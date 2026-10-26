# Abre o formulário para puxar os dados atuais da produção (caminho secreto aleatório)
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
