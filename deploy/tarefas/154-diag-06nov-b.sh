#!/usr/bin/env bash
# Diagnóstico (somente leitura): ações de estoque em 06/11 11:19-11:22 e o que atualizou as 4 chapas WKB
source deploy/lib.sh
sql -c "select to_char(data_hora at time zone 'America/Sao_Paulo','HH24:MI:SS.MS') h, usuario, tipo_acao, left(descricao,220) from historico_acoes where data_hora between '2026-11-06 14:19:30+00' and '2026-11-06 14:21:00+00' order by data_hora;"
sql -c "select tabela, acao, usuario, data_hora, left(coalesce(dados_novos::text,''),200) from auditoria where data_hora between '2026-11-06 14:19:30+00' and '2026-11-06 14:21:00+00' order by data_hora;" 2>&1 | head -30
sql -c "select string_agg(table_name, ',') from information_schema.tables where table_schema='public' and table_name ilike '%audit%';"
