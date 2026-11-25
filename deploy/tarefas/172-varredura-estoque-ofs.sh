#!/usr/bin/env bash
# 25/11: varredura 2 (só leitura)
source deploy/lib.sh
echo "== chapas com saldo negativo"
sql -c "select fornecedor, nomenclatura, tamanho, categoria, coalesce(quantidade_atual,quantidade) saldo from chapas_estoque_v2 where coalesce(quantidade_atual,quantidade) < 0 order by 5 limit 20;" 2>&1 | head -25
echo "== saldo diferente da soma dos movimentos (top 15)"
sql -c "with s as (select chapa_id, sum(delta) soma, count(*) n from chapas_estoque_movimentos_v2 group by 1) select c.fornecedor, c.nomenclatura, c.tamanho, coalesce(c.quantidade_atual,c.quantidade) saldo, s.soma, s.n from chapas_estoque_v2 c join s on s.chapa_id=c.id where coalesce(c.quantidade_atual,c.quantidade) <> s.soma order by abs(coalesce(c.quantidade_atual,c.quantidade) - s.soma) desc limit 15;" 2>&1 | head -20
sql -c "with s as (select chapa_id, sum(delta) soma from chapas_estoque_movimentos_v2 group by 1) select count(*) filter (where coalesce(c.quantidade_atual,c.quantidade) <> s.soma) diferentes, count(*) total from chapas_estoque_v2 c join s on s.chapa_id=c.id;" 2>&1
echo "== chapas duplicadas no cadastro (mesmo forn+nom+tam)"
sql -c "select upper(fornecedor) f, upper(nomenclatura) n, upper(replace(tamanho,' ','')) t, count(*), string_agg(coalesce(categoria,'?')||':'||coalesce(quantidade_atual,quantidade)::text, ' / ') from chapas_estoque_v2 group by 1,2,3 having count(*)>1 order by 4 desc limit 20;" 2>&1 | head -25
echo "== OFs iguais criadas com < 2 min (7 dias, ativas)"
sql -c "select a.numero n1, b.numero n2, left(a.descricao,28) d, a.qtd, to_char(a.created_at at time zone 'America/Sao_Paulo','DD/MM HH24:MI:SS') h1, to_char(b.created_at at time zone 'America/Sao_Paulo','HH24:MI:SS') h2, a.dim_comprimento||'x'||a.dim_largura dim1, b.dim_comprimento||'x'||b.dim_largura dim2, left(a.cores_impressao::text,25) c1, left(b.cores_impressao::text,25) c2, a.status s1, b.status s2 from ofs a join ofs b on b.cli_id is not distinct from a.cli_id and b.descricao=a.descricao and b.qtd=a.qtd and b.created_at > a.created_at and b.created_at < a.created_at + interval '2 minutes' where a.created_at > now() - interval '7 days' and a.deleted_at is null and b.deleted_at is null order by a.created_at;" 2>&1 | head -30
