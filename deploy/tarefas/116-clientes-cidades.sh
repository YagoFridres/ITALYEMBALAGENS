#!/bin/bash
# Clientes com mais de uma cidade de entrega + acertos pedidos pelo Yago em 12/11
source "$(dirname "$0")/../lib.sh"
sql -c "alter table public.clientes add column if not exists cidades_entrega jsonb not null default '[]'::jsonb;"
sql -c "NOTIFY pgrst, 'reload schema';"
sql <<'SQL'
-- Madeireira Passa Perto: só Barra Bonita
UPDATE public.ofs SET cidade_entrega = 'Barra Bonita', updated_at = now() WHERE numero::text IN ('4890','4891','4898','4899') AND cliente_nome ILIKE '%PASSA PERTO%';
-- Marlexdo: Cunha Porã (principal) + São José, Curitiba, Porto Alegre
DO $$ DECLARE n int; BEGIN
  SELECT count(*) INTO n FROM public.clientes WHERE nome ILIKE 'MARLEXDO%';
  IF n = 1 THEN UPDATE public.clientes SET cidade = 'Cunha Porã', cidades_entrega = '["São José","Curitiba","Porto Alegre"]'::jsonb, updated_at = now() WHERE nome ILIKE 'MARLEXDO%';
  ELSE RAISE NOTICE 'Marlexdo: % cadastros encontrados — não alterado', n; END IF;
END $$;
-- Elevare: OFs 4689/4690 ligadas ao cadastro e cidade Modelo
DO $$ DECLARE n int; cid uuid; BEGIN
  SELECT count(*) INTO n FROM public.clientes WHERE nome ILIKE 'ELEVARE%';
  IF n = 1 THEN
    SELECT id INTO cid FROM public.clientes WHERE nome ILIKE 'ELEVARE%';
    UPDATE public.clientes SET cidade = 'Modelo', updated_at = now() WHERE id = cid AND coalesce(trim(cidade),'') = '';
    UPDATE public.ofs SET cliente_id = cid, cli_id = cid, cidade_entrega = 'Modelo', updated_at = now() WHERE numero::text IN ('4689','4690');
  ELSE RAISE NOTICE 'Elevare: % cadastros encontrados — não alterado', n; END IF;
END $$;
SQL
sql -c "select numero, cliente_nome, cliente_id, cidade_entrega from public.ofs where numero::text in ('4689','4690','4719','4890','4891','4898','4899') order by numero;"
sql -c "select nome, cidade, cidades_entrega from public.clientes where nome ilike 'MARLEXDO%' or nome ilike 'ELEVARE%' or nome ilike '%PASSA PERTO%';"
