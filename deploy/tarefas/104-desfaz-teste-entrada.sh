#!/bin/bash
# Desfaz o teste de entrada de chapa feito em 09/11 (placa TST1A23, responsável "Teste Claude")
source "$(dirname "$0")/../lib.sh"
ID='1501f449-f281-409c-96de-d70cb8f6a5f2'
sql <<SQL
\echo == antes ==
select id, fornecedor, quantidade from chapas_estoque_v2 where id='$ID';
select fornecedor, quantidade from chapas_estoque_v2_bkp_20261106 where id='$ID';
\echo == colunas de log ==
select table_name from information_schema.tables where table_schema='public' and (table_name ilike '%log%' or table_name ilike '%audit%') order by 1;
begin;
update chapas_estoque_v2 c set fornecedor = b.fornecedor from chapas_estoque_v2_bkp_20261106 b where c.id='$ID' and b.id=c.id and c.fornecedor='TESTE';
update chapas_estoque_v2 set quantidade = 1000 where id='$ID' and quantidade = 1001;
delete from chapas_estoque_movimentos_v2 where chapa_id='$ID' and obs ilike '%Teste Claude%TST1A23%';
delete from recebimento_insumos where placa_veiculo='TST1A23' and responsavel='Teste Claude';
commit;
\echo == depois ==
select id, fornecedor, quantidade, updated_at from chapas_estoque_v2 where id='$ID';
select count(*) movs_teste from chapas_estoque_movimentos_v2 where obs ilike '%Teste Claude%';
select count(*) checklist_teste from recebimento_insumos where placa_veiculo='TST1A23';
SQL
