#!/usr/bin/env bash
# 23/11: apaga só as 2 versões criadas no teste da CMP-023 (a compra já voltou a ficar como era)
source deploy/lib.sh
sql <<'SQL'
delete from compras_chapas_versoes where numero_compra = 23 and criado_em >= '2026-11-23 19:10:00+00' and criado_em < '2026-11-23 19:30:00+00';
select numero_compra, versao, motivo, criado_em from compras_chapas_versoes order by criado_em desc limit 10;
SQL
