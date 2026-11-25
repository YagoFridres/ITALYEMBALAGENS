#!/usr/bin/env bash
# 25/11: varredura de erros (só leitura)
source deploy/lib.sh
echo "== erros do servidor (agrupados, últimas 8000 linhas)"
pm2 logs pcp-pro --err --lines 8000 --nostream 2>/dev/null | grep -v "BOOT SCHEMA" | sed -E 's/^[0-9]+\|pcp-pro *\| *//; s/[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:.Z]+//g; s/[0-9a-f]{8}-[0-9a-f-]{27}/<id>/g; s/[0-9]+/N/g; s/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+/<email>/g' | cut -c1-160 | sort | uniq -c | sort -rn | head -30
echo "== trava de chapas repetidas acionada"
pm2 logs pcp-pro --out --lines 20000 --nostream 2>/dev/null | grep -c "CHAPA-DEDUPE"
echo "== chapas com saldo negativo"
sql -c "select fornecedor, nomenclatura, tamanho, coalesce(quantidade_atual,quantidade) saldo from chapas_estoque_v2 where coalesce(quantidade_atual,quantidade) < 0 and deleted_at is null order by 4 limit 20;" 2>&1 | head -25
echo "== saldo da chapa diferente da soma dos movimentos (top 15)"
sql -c "with s as (select chapa_id, sum(delta) soma from chapas_estoque_movimentos_v2 group by 1) select c.fornecedor, c.nomenclatura, c.tamanho, coalesce(c.quantidade_atual,c.quantidade) saldo, s.soma from chapas_estoque_v2 c join s on s.chapa_id=c.id where c.deleted_at is null and coalesce(c.quantidade_atual,c.quantidade) <> s.soma order by abs(coalesce(c.quantidade_atual,c.quantidade) - s.soma) desc limit 15;" 2>&1 | head -20
echo "== chapas duplicadas no cadastro (mesmo forn+nom+tam ativas)"
sql -c "select upper(fornecedor) f, upper(nomenclatura) n, upper(replace(tamanho,' ','')) t, count(*) from chapas_estoque_v2 where deleted_at is null group by 1,2,3 having count(*)>1 order by 4 desc limit 20;" 2>&1 | head -25
echo "== OFs abertas sem número / duplicadas de número"
sql -c "select numero, count(*) from ofs where deleted_at is null group by 1 having count(*)>1 limit 10;" 2>&1 | head -12
echo "== OFs iguais criadas com < 2 min (últimos 7 dias, ativas)"
sql -c "select a.numero, b.numero, left(a.descricao,30), a.qtd, to_char(a.created_at at time zone 'America/Sao_Paulo','DD/MM HH24:MI:SS') from ofs a join ofs b on b.cli_id is not distinct from a.cli_id and b.descricao=a.descricao and b.qtd=a.qtd and b.created_at > a.created_at and b.created_at < a.created_at + interval '2 minutes' where a.created_at > now() - interval '7 days' and a.deleted_at is null and b.deleted_at is null order by a.created_at;" 2>&1 | head -20
