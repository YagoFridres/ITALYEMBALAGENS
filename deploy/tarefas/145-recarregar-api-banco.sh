#!/bin/bash
# 17/11: a API do banco não reconhecia a coluna "localizacao" das facas (cache de colunas desatualizado).
# Reinicia só o serviço da API (PostgREST) para reler as colunas. Leva poucos segundos.
source "$(dirname "$0")/../lib.sh"
$DC ps --services
svc=$($DC ps --services | grep -E -m1 '^(rest|postgrest|api)$')
echo "servico: $svc"
[ -n "$svc" ] && $DC restart "$svc"
sleep 4
$DC ps
