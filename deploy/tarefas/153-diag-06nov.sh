#!/usr/bin/env bash
# Diagnóstico (somente leitura): o que aconteceu no estoque de chapas em 06/11 por volta das 11:20
source deploy/lib.sh
sql -c "select data_hora at time zone 'America/Sao_Paulo' as quando, usuario, tipo_acao, left(descricao,200) from historico_acoes where data_hora between '2026-11-06 13:50+00' and '2026-11-06 14:50+00' order by data_hora;"
ls -la /opt/pcp-pro/tarefas-feitas | awk '$6=="Nov" && $7=="6"' | head -20
grep -h "2026-11-06 1[01]:" /opt/pcp-pro/deploy.log | head -20
