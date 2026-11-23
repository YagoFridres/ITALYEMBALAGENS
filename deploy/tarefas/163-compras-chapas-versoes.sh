#!/usr/bin/env bash
# 23/11: versões das compras de papelão (a compra como estava antes de cada alteração)
source deploy/lib.sh
sql <<'SQL'
create table if not exists compras_chapas_versoes (
  id uuid primary key default gen_random_uuid(),
  compra_id text not null,
  numero_compra integer,
  versao integer not null,
  dados jsonb not null,
  usuario text,
  motivo text,
  criado_em timestamptz not null default now()
);
create index if not exists compras_chapas_versoes_compra_idx on compras_chapas_versoes (compra_id, versao desc);
grant all on public.compras_chapas_versoes to anon, authenticated, service_role;
select count(*) as versoes from compras_chapas_versoes;
SQL
recarregar_api
echo "== histórico antigo existente (audit_log) das compras"
sql -c "select tabela, operacao, count(*) from audit_log where tabela ilike 'compras%' group by 1,2 order by 1,2;" || true
