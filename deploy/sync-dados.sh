#!/usr/bin/env bash
# Recopia o banco e os arquivos do Supabase (só leitura) para o servidor de TESTE.
set -uo pipefail
if [ -n "${1:-}" ] && [ -f "$1" ]; then { read -r ORIGEM; read -r ORIGEM_KEY; } < "$1"; rm -f "$1"; else read -r ORIGEM; read -r ORIGEM_KEY; fi
B=/opt/pcp-pro
echo "== $(date '+%F %T') início"
cd $B/banco
echo "==> Backup do banco de teste atual"
docker compose exec -T db pg_dump -U postgres -d postgres --schema=public -Fc </dev/null > $B/backups/antes-sync-$(date +%F_%H%M).dump && ls -lh $B/backups | tail -2
echo "==> Guardando o que só existe aqui (estoque da planilha, almoxarifado, solicitações, sequência, modo operador)"
LOCAIS="sync_ignorar almox_ordens papelao_solicitacoes sequenciamento_manual producao_sessoes chapas_estoque_movimentos_v2 chapas_estoque_v2 produtos_cadastro"
ARGS=""; for t in $LOCAIS; do ARGS="$ARGS -t public.$t"; done
docker compose exec -T db pg_dump -U postgres -d postgres --data-only $ARGS </dev/null > $B/backups/locais-$(date +%F_%H%M).sql && ls -lh $B/backups/locais-*.sql | tail -1
LOCAIS_SQL=$(ls -t $B/backups/locais-*.sql | head -1)
pm2 stop pcp-pro >/dev/null 2>&1 || true
echo "==> Limpando schema public do banco de TESTE"
docker compose exec -T db psql -U postgres -c 'drop schema public cascade; create schema public;' </dev/null
mkdir -p /opt/pcp-pro/sync-estado; for t in vendedores clientes ofs; do date -u "+%F %T+00" > /opt/pcp-pro/sync-estado/$t.wm; done
echo "==> Copiando banco"
bash $B/02-copiar-banco.sh "$ORIGEM" </dev/null || echo "!! cópia do banco teve erro"
echo "==> Copiando fotos/arquivos"
ORIGEM_URL=https://ubygjqxkflfachtlogdw.supabase.co ORIGEM_KEY="$ORIGEM_KEY" node $B/03-copiar-arquivos.js </dev/null 2>&1 | tail -5
echo "==> Reaplicando correções de banco"
docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=0 < $B/app/deploy/fixes-banco.sql 2>&1 | grep -v NOTICE | tail -5
echo "==> Devolvendo o que só existe aqui"
for t in $LOCAIS; do docker compose exec -T db psql -U postgres -d postgres -q -c "delete from public.$t;" </dev/null 2>&1 | grep -v NOTICE; done
docker compose exec -T db psql -U postgres -d postgres -q < "$LOCAIS_SQL" 2>&1 | grep -v -E "NOTICE|^SET|set_config" | tail -5
docker compose exec -T db psql -U postgres -c "NOTIFY pgrst, 'reload schema';" </dev/null >/dev/null
echo "==> Conferência"
docker compose exec -T db psql -U postgres -At -c "select 'ofs='||count(*)||' max='||max(numero) from ofs;" </dev/null
pm2 start pcp-pro >/dev/null 2>&1 || pm2 start /root/migracao-hostgator/ecosystem.config.js
unset ORIGEM ORIGEM_KEY
echo "== $(date '+%F %T') fim"
