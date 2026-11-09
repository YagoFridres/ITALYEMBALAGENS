#!/bin/bash
# Desfaz o teste de saída de chapa de 09/11 (responsável "Teste Claude") e confere o saldo
source "$(dirname "$0")/../lib.sh"
ID='1501f449-f281-409c-96de-d70cb8f6a5f2'
sql <<SQL
\echo == antes ==
select quantidade from chapas_estoque_v2 where id='$ID';
select created_at, tipo, delta, qtd_anterior, qtd_nova, left(obs,60) from chapas_estoque_movimentos_v2 where chapa_id='$ID' order by created_at desc limit 5;
begin;
delete from chapas_estoque_movimentos_v2 where chapa_id='$ID' and obs ilike '%Teste Claude%';
update chapas_estoque_v2 set quantidade = 1000 where id='$ID';
commit;
\echo == depois ==
select quantidade, fornecedor from chapas_estoque_v2 where id='$ID';
select count(*) movs_teste from chapas_estoque_movimentos_v2 where obs ilike '%Teste Claude%' or obs ilike '%TESTE - será revertido%';
SQL
