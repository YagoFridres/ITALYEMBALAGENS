#!/usr/bin/env bash
# 25/11: diagnóstico — entradas/saídas de chapas duplicadas e OF 5331 (só leitura)
source deploy/lib.sh
echo "== movimentos desde 24/11 16:50 (hora SP, com segundos)"
sql -c "select to_char(created_at at time zone 'America/Sao_Paulo','DD HH24:MI:SS.MS') h, left(chapa_id::text,8) chapa, delta, origem, left(coalesce(origem_id::text,''),8) orig_id, left(coalesce(responsavel,''),14) resp, left(coalesce(reverted_by,''),20) desfeito, nf from chapas_estoque_movimentos_v2 where created_at >= '2026-11-24 19:50+00' order by created_at;" 2>&1 | head -80
echo "== colunas"
sql -c "select column_name from information_schema.columns where table_name='chapas_estoque_movimentos_v2' order by ordinal_position;" | tr '\n' ' '
echo
echo "== log entrada/saida-lote"
pm2 logs pcp-pro --out --lines 8000 --nostream 2>/dev/null | grep -iE "entrada-lote|saida-lote|ENTRADA-LOTE|SAIDA-LOTE|chapas/entrada|chapas/saida" | cut -c1-200 | tail -40
echo "== OF 5331"
sql -c "select numero, status, deleted_at, left(descricao,30) d, clinome, updated_at from ofs where numero::text='5331';"
sql -c "select to_char(created_at at time zone 'America/Sao_Paulo','DD/MM HH24:MI') h, acao, left(coalesce(descricao,''),120) d from historico_acoes where descricao ilike '%5331%' order by created_at desc limit 8;" || true
