#!/bin/bash
# Produtos: máquina em que o produto passa (preenche a OF sozinha) — 11/11
source "$(dirname "$0")/../lib.sh"
sql -c "alter table public.produtos_cadastro add column if not exists maquina text;"
sql -c "NOTIFY pgrst, 'reload schema';"
sql -c "select column_name from information_schema.columns where table_name='produtos_cadastro' and column_name='maquina';"
