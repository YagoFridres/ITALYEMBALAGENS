#!/usr/bin/env bash
# Deploy automático do servidor de TESTE (HostGator VPS).
# Roda a cada minuto pelo cron: se a branch hostgator-teste mudou no GitHub,
# atualiza o código, roda as tarefas novas de deploy/tarefas/ (uma vez cada)
# e reinicia o ERP. Instalação (uma vez, no console do VPS):
#   cd /opt/pcp-pro/app; git fetch origin hostgator-teste; git checkout -f origin/hostgator-teste -- deploy; bash deploy/vps-deploy.sh install
set -uo pipefail
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
APP=/opt/pcp-pro/app
BR=hostgator-teste
B=/opt/pcp-pro
LOGDIR=$B/tarefas-log
FEITAS=$B/tarefas-feitas
mkdir -p "$LOGDIR" "$FEITAS"

if [ "${1:-}" = "install" ]; then
  cp "$APP/deploy/vps-deploy.sh" /root/pcp-deploy.sh && chmod 700 /root/pcp-deploy.sh
  ( crontab -l 2>/dev/null | grep -v pcp-deploy; echo "* * * * * flock -n /tmp/pcp-deploy.lock /root/pcp-deploy.sh >> $B/deploy.log 2>&1" ) | crontab -
  echo "cron instalado"
fi

cd "$APP" || exit 1
git fetch -q origin "$BR" || { echo "$(date '+%F %T') fetch falhou"; exit 0; }
NEW=$(git rev-parse "origin/$BR")
CUR=$(git rev-parse HEAD)
if [ "$NEW" = "$CUR" ] && [ "${1:-}" != "install" ]; then exit 0; fi

echo "== $(date '+%F %T') deploy $CUR -> $NEW"
LOCK_ANTES=$(git rev-parse HEAD:package-lock.json 2>/dev/null || echo x)
git checkout -qf -B "$BR" "origin/$BR"
cp deploy/vps-deploy.sh /root/pcp-deploy.sh 2>/dev/null || true
if [ "$LOCK_ANTES" != "$(git rev-parse HEAD:package-lock.json 2>/dev/null || echo y)" ]; then
  echo "package-lock mudou: npm ci"; npm ci --omit=dev >> "$B/deploy.log" 2>&1 || echo "npm ci falhou"
fi

# Tarefas únicas (SQL, ajustes de servidor). Cada arquivo roda uma vez; a saída fica em tarefas-log/.
for f in deploy/tarefas/*.sh; do
  [ -e "$f" ] || continue
  n=$(basename "$f")
  [ -e "$FEITAS/$n" ] && continue
  echo "tarefa: $n"
  ( cd "$APP" && timeout 1800 bash "$f" ) < /dev/null > "$LOGDIR/$n.log" 2>&1
  echo "exit=$?" >> "$LOGDIR/$n.log"
  touch "$FEITAS/$n"
done

pm2 restart pcp-pro --update-env > /dev/null 2>&1 || pm2 start /root/migracao-hostgator/ecosystem.config.js
echo "ok $(git log -1 --format='%h %s')"
