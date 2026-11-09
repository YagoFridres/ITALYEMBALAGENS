#!/bin/bash
# Backup do estoque de chapas antes de importar a planilha 12 (09/11)
source "$(dirname "$0")/../lib.sh"
sql -c "drop table if exists chapas_estoque_v2_bkp_20261109; create table chapas_estoque_v2_bkp_20261109 as select * from chapas_estoque_v2;"
sql -c "select count(*) chapas, sum(quantidade) unidades, round(sum(quantidade*coalesce(valor_unitario,0))::numeric,2) valor from chapas_estoque_v2_bkp_20261109;"
