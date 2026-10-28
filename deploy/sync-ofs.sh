#!/usr/bin/env bash
# Sincronização INCREMENTAL (servidor de TESTE): traz do Supabase só os registros NOVOS (criados lá) desde a
# última vez em ofs, clientes e vendedores; o que já existe aqui não é sobrescrito. O Supabase é só lido. Não tira o sistema do ar.
# Usa a conexão guardada em /etc/pcp-pro/sync-origem (só root lê); sem ela, não faz nada.
set -uo pipefail
SEG=/etc/pcp-pro/sync-origem
EST=/opt/pcp-pro/sync-estado
if [ -n "${1:-}" ] && [ -f "$1" ]; then CS=$(head -n1 "$1"); rm -f "$1"
elif [ -f "$SEG" ]; then CS=$(head -n1 "$SEG")
else echo "sem conexão guardada ($SEG) — nada a fazer"; exit 0; fi
mkdir -p "$EST"
exec 9>"$EST/.lock"; flock -n 9 || { echo "já rodando"; exit 0; }
DC="docker compose -f /opt/pcp-pro/banco/docker-compose.yml --env-file /opt/pcp-pro/banco/.env"
loc() { $DC exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -P pager=off "$@"; }
src() { docker run --rm -i -e PGCONNECT_TIMEOUT=20 postgres:17 psql "$CS" -v ON_ERROR_STOP=1 "$@"; }

loc -q -c "create table if not exists public.sync_ignorar (tabela text not null, id text not null, motivo text, criado_em timestamptz default now(), primary key (tabela, id));" </dev/null >/dev/null

echo "== $(date '+%F %T') sync incremental"
for T in vendedores clientes ofs; do
  WM_F="$EST/$T.wm"
  WM=$(cat "$WM_F" 2>/dev/null || echo "2026-10-27 12:30:00+00")
  # colunas que existem nos dois lados (e não são geradas)
  CL=$(loc -At -c "select string_agg(column_name, ',' order by column_name) from information_schema.columns where table_schema='public' and table_name='$T' and is_generated='NEVER';" </dev/null)
  CR=$(src -At -c "select string_agg(column_name, ',' order by column_name) from information_schema.columns where table_schema='public' and table_name='$T';" </dev/null) || { echo "!! $T: sem acesso à origem"; continue; }
  COLS=$(comm -12 <(tr ',' '\n' <<<"$CL" | sort) <(tr ',' '\n' <<<"$CR" | sort) | paste -sd, -)
  [ -n "$COLS" ] || { echo "!! $T: sem colunas em comum"; continue; }
  if   [[ ",$COLS," == *",updated_at,"* ]]; then CT="coalesce(updated_at, created_at)"
  elif [[ ",$COLS," == *",created_at,"* ]]; then CT="created_at"
  else echo "-- $T: sem data de alteração, pulado"; continue; fi
  Q=$(sed 's/[^,]*/"&"/g' <<<"$COLS")
  TMP=$(mktemp)
  src -At -c "\copy (select $Q from public.$T where $CT > '$WM' order by $CT) to stdout with (format csv)" </dev/null >"$TMP" || { echo "!! $T: falha ao ler"; rm -f "$TMP"; continue; }
  N=$(grep -c '' "$TMP" || true)
  if [ "${N:-0}" -gt 0 ]; then
    NOVO=$(src -At -c "select max($CT) from public.$T where $CT > '$WM';" </dev/null)
    SETS=$(tr ',' '\n' <<<"$COLS" | grep -vx id | sed 's/.*/"&"=excluded."&"/' | paste -sd, -)
    {
      echo "begin;"
      echo "create temp table _in as select $Q from public.$T limit 0;"
      echo "copy _in ($Q) from stdin with (format csv);"
      cat "$TMP"
      echo '\.'
      echo "delete from _in where id::text in (select id from public.sync_ignorar where tabela='$T');"
      # 28/10: a equipe já trabalha neste sistema; o antigo só pode TRAZER registros novos, nunca sobrescrever os daqui
      # (em 27/10 a sincronização desfez conclusões feitas aqui porque o sistema antigo mexeu nas mesmas OFs).
      echo "insert into public.$T ($Q) select $Q from _in on conflict (id) do nothing;"
      echo "commit;"
    } | loc -q >/dev/null && { echo "$NOVO" >"$WM_F"; echo "$T: $N linha(s) novas/alteradas (até $NOVO)"; } || echo "!! $T: falha ao gravar"
  else
    echo "$T: nada novo"
  fi
  rm -f "$TMP"
done
loc -q -c "NOTIFY pgrst, 'reload schema';" </dev/null >/dev/null 2>&1 || true
unset CS
