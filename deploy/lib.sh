# Funções para as tarefas de deploy (servidor de TESTE).
DC="docker compose -f /opt/pcp-pro/banco/docker-compose.yml --env-file /opt/pcp-pro/banco/.env"
sql() { $DC exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -P pager=off "$@"; }
recarregar_api() { sql -c "NOTIFY pgrst, 'reload schema';" >/dev/null 2>&1; }
