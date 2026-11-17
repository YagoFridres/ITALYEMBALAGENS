#!/bin/bash
# Diagnóstico (somente leitura): entradas do retalho CHADC21 940X1450 — 17/11
source "$(dirname "$0")/../lib.sh"
sql -c "select id, tipo, delta, qtd_anterior, qtd_nova, origem, obs, usuario, reverted, to_char(created_at at time zone 'America/Sao_Paulo','DD/MM HH24:MI:SS') em from chapas_estoque_movimentos_v2 where chapa_id='df256daa-cb68-4e9b-ad74-a526ed3c9d71' order by created_at" 2>&1
sql -c "select quantidade, quantidade_atual from chapas_estoque_v2 where id='df256daa-cb68-4e9b-ad74-a526ed3c9d71'" 2>&1
