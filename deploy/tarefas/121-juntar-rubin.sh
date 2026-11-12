#!/bin/bash
# Junta IRMAOS RUBIN LTDA + MÓVEIS RUBIN num cadastro só: MÓVEIS IRMÃOS RUBIN LTDA (pedido do Yago 12/11)
source "$(dirname "$0")/../lib.sh"
sql <<'SQL'
DO $$
DECLARE a uuid; b uuid; na int; nb int; n int; r record; novo text := 'MÓVEIS IRMÃOS RUBIN LTDA';
BEGIN
  SELECT count(*) INTO na FROM public.clientes WHERE upper(trim(nome)) = 'IRMAOS RUBIN LTDA';
  SELECT count(*) INTO nb FROM public.clientes WHERE upper(trim(nome)) IN ('MÓVEIS RUBIN','MOVEIS RUBIN');
  IF na <> 1 OR nb <> 1 THEN RAISE NOTICE 'esperava 1+1 cadastros, achei % e % — nada feito', na, nb; RETURN; END IF;
  SELECT id INTO a FROM public.clientes WHERE upper(trim(nome)) = 'IRMAOS RUBIN LTDA';
  SELECT id INTO b FROM public.clientes WHERE upper(trim(nome)) IN ('MÓVEIS RUBIN','MOVEIS RUBIN');
  CREATE TABLE IF NOT EXISTS public.clientes_bkp_rubin AS SELECT * FROM public.clientes WHERE id IN (a, b);
  UPDATE public.clientes x SET
    nome = novo,
    rs = coalesce(nullif(trim(x.rs),''), y.rs), cnpj = coalesce(nullif(trim(x.cnpj),''), y.cnpj), documento = coalesce(nullif(trim(x.documento),''), y.documento),
    tel = coalesce(nullif(trim(x.tel),''), y.tel), telefone = coalesce(nullif(trim(x.telefone),''), y.telefone), email = coalesce(nullif(trim(x.email),''), y.email),
    cidade = coalesce(nullif(trim(x.cidade),''), y.cidade), uf = coalesce(nullif(trim(x.uf),''), y.uf), endereco = coalesce(nullif(trim(x.endereco),''), y.endereco),
    ie = coalesce(nullif(trim(x.ie),''), y.ie), ramo = coalesce(nullif(trim(x.ramo),''), y.ramo), vendedor_id = coalesce(x.vendedor_id, y.vendedor_id),
    emp_id = coalesce(nullif(trim(x.emp_id),''), y.emp_id), ativo = true, updated_at = now()
  FROM public.clientes y WHERE x.id = a AND y.id = b;
  FOR r IN SELECT c.table_name, c.column_name, c.data_type FROM information_schema.columns c JOIN information_schema.tables t ON t.table_schema=c.table_schema AND t.table_name=c.table_name AND t.table_type='BASE TABLE'
           WHERE c.table_schema='public' AND c.table_name NOT LIKE 'clientes%' AND c.column_name IN ('cliente_id','cli_id','cliid')
  LOOP
    IF r.data_type = 'uuid' THEN EXECUTE format('UPDATE public.%I SET %I = $1 WHERE %I = $2', r.table_name, r.column_name, r.column_name) USING a, b;
    ELSE EXECUTE format('UPDATE public.%I SET %I = $1 WHERE %I = $2', r.table_name, r.column_name, r.column_name) USING a::text, b::text; END IF;
    GET DIAGNOSTICS n = ROW_COUNT; IF n > 0 THEN RAISE NOTICE '%.%: % linha(s)', r.table_name, r.column_name, n; END IF;
  END LOOP;
  UPDATE public.ofs SET cliente_nome = novo, updated_at = now() WHERE cliente_id = a;
  GET DIAGNOSTICS n = ROW_COUNT; RAISE NOTICE 'ofs com o nome novo: %', n;
  DELETE FROM public.clientes WHERE id = b;
  RAISE NOTICE 'cadastro repetido apagado';
END $$;
SQL
sql -c "select id, nome, cnpj, tel, email, cidade, uf, emp_id, vendedor_id from public.clientes where nome ilike '%RUBIN%';"
sql -c "select count(*) as ofs from public.ofs where cliente_nome = 'MÓVEIS IRMÃOS RUBIN LTDA';"
