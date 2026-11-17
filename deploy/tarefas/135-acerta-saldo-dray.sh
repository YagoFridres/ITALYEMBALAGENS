#!/bin/bash
# 17/11: chapa DRAY 791X2192 — a entrada de teste de 1 un. (09/11) foi desfeita; saldo certo é 200 (a tela mostrava 201)
source "$(dirname "$0")/../lib.sh"
sql -c "update public.chapas_estoque_v2 set quantidade_atual = 200 where id='c057834f-3192-4839-8e45-dc7b2d839ef5' and quantidade = 200 returning nome_uso, tamanho, quantidade, quantidade_atual" 2>&1
sql -c "select count(*) diferentes from public.chapas_estoque_v2 where quantidade_atual is not null and quantidade_atual <> quantidade" 2>&1
