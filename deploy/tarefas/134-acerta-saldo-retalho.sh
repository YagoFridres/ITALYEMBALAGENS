#!/bin/bash
# 17/11: acerta o saldo mostrado do retalho CHADC21 940X1450 (86, depois de desfazer a soma repetida)
# e mostra o histórico da chapa DRAY 791X2192 (200 x 201) para conferir qual saldo é o certo.
source "$(dirname "$0")/../lib.sh"
sql -c "update public.chapas_estoque_v2 set quantidade_atual = 86 where id='df256daa-cb68-4e9b-ad74-a526ed3c9d71' and quantidade = 86 returning nome_uso, tamanho, quantidade, quantidade_atual" 2>&1
sql -c "select tipo, delta, qtd_anterior, qtd_nova, origem, obs, reverted, to_char(created_at at time zone 'America/Sao_Paulo','DD/MM HH24:MI') em from chapas_estoque_movimentos_v2 where chapa_id='c057834f-3192-4839-8e45-dc7b2d839ef5' order by created_at" 2>&1
