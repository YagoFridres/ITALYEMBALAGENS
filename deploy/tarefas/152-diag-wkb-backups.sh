#!/usr/bin/env bash
# Diagnóstico (somente leitura): saldo das 4 chapas WKB em cada backup diário, para achar o dia em que mudou
source deploy/lib.sh
for f in $(ls -1 /opt/pcp-pro/backups/*.dump 2>/dev/null | sort); do
  echo "== $(basename "$f")"
  $DC exec -T db pg_restore -a -t chapas_estoque_v2 -f - < "$f" 2>/dev/null | grep -E "466X917|730X820|630X780|520X640" | awk -F'\t' '{ for(i=1;i<=NF;i++) if($i ~ /^(466X917|730X820|630X780|520X640)$/) t=$i; print t }' | head -0
  $DC exec -T db pg_restore -a -t chapas_estoque_v2 -f - < "$f" 2>/dev/null | grep -E "WKB.*(466X917|730X820|630X780|520X640)" | cut -c1-400
done
echo "== colunas"
sql -c "select string_agg(column_name, ',' order by ordinal_position) from information_schema.columns where table_name='chapas_estoque_v2';"
echo "== consumo/baixa recentes WKB no historico"
sql -c "select data_hora at time zone 'America/Sao_Paulo', usuario, tipo_acao, left(descricao,160) from historico_acoes where data_hora between '2026-11-05' and '2026-11-18 11:00' and (descricao ilike '%466X917%' or descricao ilike '%730X820%' or descricao ilike '%630X780%' or descricao ilike '%520X640%') order by 1;"
