#!/usr/bin/env bash
# 25/11: diagnóstico 2 (só leitura)
source deploy/lib.sh
sql -c "select to_char(created_at at time zone 'America/Sao_Paulo','DD HH24:MI:SS.MS') h, left(chapa_id::text,8) chapa, delta, qtd_anterior ant, qtd_nova nova, origem, left(coalesce(origem_id::text,''),8) orig_id, left(coalesce(usuario,''),14) usr, reverted rev, nf from chapas_estoque_movimentos_v2 where created_at >= '2026-11-24 19:50+00' order by created_at;" 2>&1 | head -90
echo "== historico_acoes colunas"
sql -c "select column_name from information_schema.columns where table_name='historico_acoes' order by ordinal_position;" | tr '\n' ' '
echo
sql -c "select * from historico_acoes where cast(historico_acoes as text) ilike '%5331%' limit 6;" 2>&1 | cut -c1-400
echo "== OF 5331 campos de status"
sql -c "select status, status_anterior, fluxo_maquinas is not null fluxo, data_entrega, concluida_em from ofs where numero::text='5331';" 2>&1 | cut -c1-300
