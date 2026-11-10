#!/bin/bash
# OF: número do pedido do cliente (10/11)
source "$(dirname "$0")/../lib.sh"
sql -c "alter table public.ofs add column if not exists num_pedido text;"
sql -c "NOTIFY pgrst, 'reload schema';"
sql -c "select column_name, data_type from information_schema.columns where table_name='ofs' and column_name='num_pedido';"
