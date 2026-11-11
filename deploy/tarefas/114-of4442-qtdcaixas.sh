#!/bin/bash
source "$(dirname "$0")/../lib.sh"
sql -c "UPDATE public.ofs SET passagens_maquina = (SELECT jsonb_agg(CASE WHEN (e->>'qtd_caixas')::numeric = 1847 THEN e || jsonb_build_object('qtd_caixas',1598) ELSE e END) FROM jsonb_array_elements(passagens_maquina::jsonb) e) WHERE id = '08008b63-844c-4a29-b815-98def6a59090';"
sql -c "select passagens_maquina from public.ofs where id='08008b63-844c-4a29-b815-98def6a59090';"
