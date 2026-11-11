#!/bin/bash
# Compra de papelão: item com resina interna (11/11)
source "$(dirname "$0")/../lib.sh"
sql -c "alter table public.compras_chapas_itens add column if not exists resina_interna boolean not null default false;"
sql -c "NOTIFY pgrst, 'reload schema';"
sql -c "select column_name, data_type from information_schema.columns where table_name='compras_chapas_itens' and column_name='resina_interna';"
