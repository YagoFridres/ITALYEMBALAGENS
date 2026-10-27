. deploy/lib.sh
echo "== tabela sync_ignorar"
sql -c "create table if not exists public.sync_ignorar (tabela text not null, id text not null, motivo text, criado_em timestamptz default now(), primary key (tabela, id));"
echo "== apagando a OF de teste 4371 (produto 'teste')"
sql -At -c "insert into public.sync_ignorar(tabela,id,motivo) select 'ofs', id::text, 'OF de teste apagada a pedido do Yago 27/10' from public.ofs where of::text='4371' and produto ilike 'teste' on conflict do nothing returning id;"
sql -At -c "delete from public.ofs where of::text='4371' and produto ilike 'teste' returning id, of;"
sql -At -c "select of, produto, created_at from public.ofs where of::text in ('4370','4371','4372') order by 1;"
echo "== restrições únicas em ofs"
sql -At -c "select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid='public.ofs'::regclass and contype in ('u','p');"
sql -At -c "select indexname, indexdef from pg_indexes where tablename='ofs' and indexdef ilike '%unique%';"
echo "== serviço e timer da sincronização incremental (timer só liga pelo formulário)"
cat > /etc/systemd/system/pcp-sync-ofs.service <<'U'
[Unit]
Description=PCP teste - puxa OFs novas do Supabase
[Service]
Type=oneshot
Environment=HOME=/root
ExecStart=/bin/bash /opt/pcp-pro/app/deploy/sync-ofs.sh
StandardOutput=append:/opt/pcp-pro/tarefas-log/sync-ofs.log
StandardError=append:/opt/pcp-pro/tarefas-log/sync-ofs.log
U
cat > /etc/systemd/system/pcp-sync-ofs.timer <<'U'
[Unit]
Description=PCP teste - OFs novas a cada 5 min
[Timer]
OnBootSec=2min
OnUnitActiveSec=5min
[Install]
WantedBy=timers.target
U
systemctl daemon-reload
mkdir -p /opt/pcp-pro/sync-estado
ls /opt/pcp-pro/sync-estado
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
