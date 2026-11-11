#!/bin/bash
# OF 4442 (DKADI DIVISORIA 14): produzido 1847 -> 1598 (-249), a pedido do Yago em 11/11.
source "$(dirname "$0")/../lib.sh"
sql <<'SQL'
BEGIN;
UPDATE public.ofs SET
  quantidade = 1598, qtd_produzida = 1598, caixas_boas = 1598, caixas_excedentes = 1598 - 800,
  valor_total = 2908.36, valor_venda = 2908.36,
  area_total_m2 = round((757.27 * 1598 / 1847.0)::numeric, 2),
  tonelada_vendida = round((0.355917 * 1598 / 1847.0)::numeric, 6),
  toneladas_utilizadas = round((0.355917 * 1598 / 1847.0)::numeric, 6),
  peso_utilizado_kg = round((355.917 * 1598 / 1847.0)::numeric, 3),
  passagens_maquina = (SELECT jsonb_agg(CASE WHEN (e->>'quantidade')::numeric = 1847 THEN e || jsonb_build_object('quantidade',1598,'qtd',1598,'qtd_produzida',1598) ELSE e END) FROM jsonb_array_elements(passagens_maquina::jsonb) e),
  updated_at = now()
WHERE id = '08008b63-844c-4a29-b815-98def6a59090' AND numero::text = '4442' AND quantidade = 1847;
UPDATE public.passagens_maquina SET quantidade = 1598 WHERE of_id::text = '08008b63-844c-4a29-b815-98def6a59090' AND quantidade = 1847;
COMMIT;
SQL
sql -c "select numero, quantidade, qtd_produzida, caixas_excedentes, valor_total, area_total_m2, tonelada_vendida, passagens_maquina from public.ofs where id='08008b63-844c-4a29-b815-98def6a59090';"
sql -c "select maquina, quantidade from public.passagens_maquina where of_id::text='08008b63-844c-4a29-b815-98def6a59090';"
