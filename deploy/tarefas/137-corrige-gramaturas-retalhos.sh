#!/bin/bash
# 17/11: retalhos criados hoje ficaram todos com gramatura 649 (a janela guardava a gramatura do cadastro anterior).
# Corrige pela gramatura do cadastro de Gramaturas de cada nomenclatura.
source "$(dirname "$0")/../lib.sh"
sql <<'SQL'
begin;
update public.chapas_estoque_v2 set gramatura = v.g
from (values ('CHAB21','367'),('CHADC21','638'),('FCM03','290'),('FCM07','470'),('KKBC80','587'),('KABC','649')) as v(n,g)
where categoria ilike 'retalho%' and upper(trim(nomenclatura)) = v.n and coalesce(gramatura::text,'') <> v.g;
commit;
SQL
sql -c "select fornecedor, nomenclatura, gramatura, count(*) itens from chapas_estoque_v2 where categoria ilike 'retalho%' group by 1,2,3 order by 1,2" 2>&1
