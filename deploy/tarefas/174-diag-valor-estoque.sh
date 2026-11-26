#!/usr/bin/env bash
# 26/11: valor real do estoque de chapas (só leitura)
source deploy/lib.sh
V="greatest(0, trunc(coalesce(quantidade_atual, quantidade, 0))) * coalesce(valor_unitario, 0)"
R="(coalesce(categoria,'') ilike 'retalho%')"
echo "== total geral"
sql -c "select count(*) itens, round(sum($V)::numeric,2) valor_total, round(sum($V) filter (where not $R)::numeric,2) so_chapas, round(sum($V) filter (where $R)::numeric,2) so_retalhos, count(*) filter (where not $R) n_chapas, count(*) filter (where $R) n_retalhos from chapas_estoque_v2;"
echo "== por emp_id (o que cada empresa selecionada enxerga)"
sql -c "select coalesce(c.emp_id::text,'(sem emp_id)') emp, coalesce(e.nome,'?') nome, count(*) itens, round(sum($V) filter (where not $R)::numeric,2) chapas, round(sum($V) filter (where $R)::numeric,2) retalhos from chapas_estoque_v2 c left join empresas e on e.id::text=c.emp_id::text group by 1,2 order by 4 desc nulls last;" 2>&1 | head -12
echo "== por qual_cnpj / empresa_vinculada"
sql -c "select upper(coalesce(nullif(qual_cnpj,''), nullif(empresa_vinculada,''), '(vazio)')) cnpj, count(*), round(sum($V) filter (where not $R)::numeric,2) chapas from chapas_estoque_v2 group by 1 order by 3 desc nulls last;" 2>&1 | head -10
echo "== por fornecedor (só chapas)"
sql -c "select upper(fornecedor) f, count(*), round(sum($V)::numeric,2) valor from chapas_estoque_v2 where not $R group by 1 order by 3 desc;" 2>&1 | head -12
echo "== por categoria (só chapas)"
sql -c "select coalesce(categoria,'(vazia)') cat, count(*), round(sum($V)::numeric,2) valor from chapas_estoque_v2 where not $R group by 1 order by 3 desc;" 2>&1 | head -12
echo "== empresa selecionada de cada usuario (preferencias)"
sql -c "select chave, left(valor::text,120) from configuracoes where chave ilike '%emp%' and (chave ilike '%sid%' or chave ilike '%usuario%') limit 10;" 2>&1 | head -12
echo "== chapas com valor suspeito (R\$/un > 100 ou = 0 com saldo)"
sql -c "select fornecedor, nomenclatura, tamanho, coalesce(quantidade_atual,quantidade) q, valor_unitario from chapas_estoque_v2 where (coalesce(valor_unitario,0) > 100 or (coalesce(valor_unitario,0) = 0 and coalesce(quantidade_atual,quantidade,0) > 0)) order by valor_unitario desc nulls last limit 20;" 2>&1 | head -25
