#!/bin/bash
# Junta os dois cadastros da Madeireira Passa Perto num só (pedido do Yago 12/11)
source "$(dirname "$0")/../lib.sh"
sql <<'SQL'
DO $$
DECLARE a uuid := '5b879717-0435-4e23-bb53-bfc265b133c0'; b uuid; n int; r record;
BEGIN
  SELECT id INTO b FROM public.clientes WHERE nome = 'MADEIREIRA PASSA PERTO LTDA' AND id <> a LIMIT 1;
  IF b IS NULL THEN RAISE NOTICE 'segundo cadastro não encontrado — nada feito'; RETURN; END IF;
  CREATE TABLE IF NOT EXISTS public.clientes_bkp_passaperto AS SELECT * FROM public.clientes WHERE id IN (a, b);
  -- completa o cadastro que tem as OFs com o que só o outro tinha
  UPDATE public.clientes x SET
    nome = 'MADEIREIRA PASSA PERTO LTDA',
    rs = coalesce(nullif(trim(x.rs),''), y.rs), cnpj = coalesce(nullif(trim(x.cnpj),''), y.cnpj), documento = coalesce(nullif(trim(x.documento),''), y.documento),
    tel = coalesce(nullif(trim(x.tel),''), y.tel), telefone = coalesce(nullif(trim(x.telefone),''), y.telefone), email = coalesce(nullif(trim(x.email),''), y.email),
    cidade = coalesce(nullif(trim(x.cidade),''), y.cidade), uf = coalesce(nullif(trim(x.uf),''), y.uf), endereco = coalesce(nullif(trim(x.endereco),''), y.endereco),
    ie = coalesce(nullif(trim(x.ie),''), y.ie), ramo = coalesce(nullif(trim(x.ramo),''), y.ramo), vendedor_id = coalesce(x.vendedor_id, y.vendedor_id), updated_at = now()
  FROM public.clientes y WHERE x.id = a AND y.id = b;
  -- o que apontava para o cadastro repetido passa a apontar para o principal
  FOR r IN SELECT c.table_name, c.column_name, c.data_type FROM information_schema.columns c JOIN information_schema.tables t ON t.table_schema=c.table_schema AND t.table_name=c.table_name AND t.table_type='BASE TABLE'
           WHERE c.table_schema='public' AND c.table_name NOT IN ('clientes','clientes_bkp_passaperto','clientes_bkp_20261112') AND c.column_name IN ('cliente_id','cli_id','cliid')
  LOOP
    IF r.data_type = 'uuid' THEN EXECUTE format('UPDATE public.%I SET %I = $1 WHERE %I = $2', r.table_name, r.column_name, r.column_name) USING a, b;
    ELSE EXECUTE format('UPDATE public.%I SET %I = $1 WHERE %I = $2', r.table_name, r.column_name, r.column_name) USING a::text, b::text; END IF;
    GET DIAGNOSTICS n = ROW_COUNT; IF n > 0 THEN RAISE NOTICE '%.%: % linha(s)', r.table_name, r.column_name, n; END IF;
  END LOOP;
  UPDATE public.ofs SET cliente_nome = 'MADEIREIRA PASSA PERTO LTDA', updated_at = now() WHERE cliente_id = a;
  GET DIAGNOSTICS n = ROW_COUNT; RAISE NOTICE 'ofs renomeadas: %', n;
  DELETE FROM public.clientes WHERE id = b;
  RAISE NOTICE 'cadastro repetido apagado';
END $$;
SQL
sql -c "select id, nome, rs, cnpj, tel, email, cidade, uf, endereco from public.clientes where nome ilike '%PASSA PERTO%';"
sql -c "select numero, cliente_nome, cidade_entrega from public.ofs where cliente_nome ilike '%PASSA PERTO%' order by numero;"
