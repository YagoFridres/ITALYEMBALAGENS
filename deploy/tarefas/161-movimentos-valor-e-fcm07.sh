#!/usr/bin/env bash
# 19/11: (1) valor por lançamento nas entradas/saídas (para poder corrigir); (2) 6 chapas FCM07 Fapolpa com valor unitário 100x maior (1236 em vez de 12,36)
source deploy/lib.sh
sql -c "select column_name from information_schema.columns where table_name='chapas_estoque_movimentos_v2' order by ordinal_position;"
sql <<'SQL'
alter table chapas_estoque_movimentos_v2 add column if not exists valor_unitario numeric;
alter table chapas_estoque_movimentos_v2 add column if not exists valor_total numeric;
select tamanho, valor_unitario as antes from chapas_estoque_v2 where nomenclatura='FCM07' and upper(fornecedor) like 'FAPOLPA%' and valor_unitario >= 100 order by tamanho;
update chapas_estoque_v2 set valor_unitario = round(valor_unitario/100.0, 4)
 where nomenclatura='FCM07' and upper(fornecedor) like 'FAPOLPA%' and valor_unitario >= 100;
select tamanho, valor_unitario as depois, valor_total from chapas_estoque_v2 where nomenclatura='FCM07' and upper(fornecedor) like 'FAPOLPA%' order by tamanho;
SQL
recarregar_api
echo "== histórico"
sql <<'SQL' || true
-- quando o valor foi mudado (histórico)
select a.created_at, a.operacao, a.dados_antes->>'valor_unitario' as vu_antes, a.dados_depois->>'valor_unitario' as vu_depois
  from audit_log a join chapas_estoque_v2 c on c.id::text = a.registro_id::text
 where c.nomenclatura='FCM07' and upper(c.fornecedor) like 'FAPOLPA%' and coalesce(a.dados_antes->>'valor_unitario','') is distinct from coalesce(a.dados_depois->>'valor_unitario','')
 order by a.created_at desc limit 20;
SQL
