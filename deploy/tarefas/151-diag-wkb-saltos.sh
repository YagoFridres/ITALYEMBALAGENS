#!/usr/bin/env bash
# Diagnóstico (somente leitura): quem mudou o saldo das chapas WKB sem lançamento entre 05/11 e 18/11
source deploy/lib.sh
sql -c "select data_hora at time zone 'America/Sao_Paulo' as quando, usuario, tipo_acao, left(descricao,180) from historico_acoes where data_hora between '2026-11-05' and '2026-11-18 11:00' and tipo_acao in ('estoque_chapas_edicao','estoque_chapas_patch','estoque_ajuste','estoque_manual') and descricao ilike '%WKB%' order by data_hora;"
