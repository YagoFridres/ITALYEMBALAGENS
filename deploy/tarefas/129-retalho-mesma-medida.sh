#!/bin/bash
# 17/11: retalho pode ter o mesmo fornecedor + nomenclatura + tamanho de uma chapa inteira.
# A regra "não repetir" passa a valer separado para chapas e para retalhos.
source "$(dirname "$0")/../lib.sh"
sql <<'SQL'
begin;
alter table public.chapas_estoque_v2 drop constraint if exists chapas_estoque_v2_fornecedor_nomenclatura_tamanho_key;
create unique index if not exists chapas_estoque_v2_forn_nom_tam_tipo_uk
  on public.chapas_estoque_v2 (fornecedor, nomenclatura, tamanho, (coalesce(categoria,'') ~* '^retalho'));
commit;
SQL
recarregar_api
sql -c "select indexname from pg_indexes where tablename='chapas_estoque_v2' and indexname like '%uk%'"
