#!/usr/bin/env bash
# Recopia o banco e os arquivos do Supabase (só leitura) para o servidor de TESTE.
set -uo pipefail
if [ -n "${1:-}" ] && [ -f "$1" ]; then { read -r ORIGEM; read -r ORIGEM_KEY; } < "$1"; rm -f "$1"; else read -r ORIGEM; read -r ORIGEM_KEY; fi
B=/opt/pcp-pro
echo "== $(date '+%F %T') início"
cd $B/banco
echo "==> Backup do banco de teste atual"
docker compose exec -T db pg_dump -U postgres -d postgres --schema=public -Fc </dev/null > $B/backups/antes-sync-$(date +%F_%H%M).dump && ls -lh $B/backups | tail -2
pm2 stop pcp-pro >/dev/null 2>&1 || true
echo "==> Limpando schema public do banco de TESTE"
docker compose exec -T db psql -U postgres -c 'drop schema public cascade; create schema public;' </dev/null
echo "==> Copiando banco"
bash $B/02-copiar-banco.sh "$ORIGEM" </dev/null || echo "!! cópia do banco teve erro"
echo "==> Copiando fotos/arquivos"
ORIGEM_URL=https://ubygjqxkflfachtlogdw.supabase.co ORIGEM_KEY="$ORIGEM_KEY" node $B/03-copiar-arquivos.js </dev/null 2>&1 | tail -5
echo "==> Reaplicando correções de banco"
docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=0 < $B/app/deploy/fixes-banco.sql 2>&1 | grep -v NOTICE | tail -5
docker compose exec -T db psql -U postgres -c "NOTIFY pgrst, 'reload schema';" </dev/null >/dev/null
echo "==> Conferência"
docker compose exec -T db psql -U postgres -At -c "select 'ofs='||count(*)||' max='||max(numero) from ofs;" </dev/null
pm2 start pcp-pro >/dev/null 2>&1 || pm2 start /root/migracao-hostgator/ecosystem.config.js
unset ORIGEM ORIGEM_KEY
echo "== $(date '+%F %T') fim"
