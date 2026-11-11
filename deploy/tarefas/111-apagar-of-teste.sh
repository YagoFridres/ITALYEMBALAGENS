#!/bin/bash
# Apaga a OF de TESTE 4878 (TESTE CLAUDE - APAGAR) e tudo ligado a ela (passagens, sessões do operador, sequência, perdas, logs).
source "$(dirname "$0")/../lib.sh"
sql <<'SQL'
DO $$
DECLARE r record; n int; oid text := '1ead4ad7-7e50-4c51-8490-e0241d036628';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.ofs WHERE id::text = oid AND numero::text = '4878' AND coalesce(descricao,'') ILIKE '%TESTE CLAUDE%') THEN
    RAISE NOTICE 'OF de teste não encontrada (ou já apagada) — nada feito'; RETURN;
  END IF;
  FOR r IN SELECT c.table_name, c.column_name FROM information_schema.columns c
           JOIN information_schema.tables t ON t.table_schema=c.table_schema AND t.table_name=c.table_name AND t.table_type='BASE TABLE'
           WHERE c.table_schema='public' AND c.table_name <> 'ofs' AND c.column_name IN ('of_id','ofs_id','registro_id')
  LOOP
    EXECUTE format('DELETE FROM public.%I WHERE %I::text = $1', r.table_name, r.column_name) USING oid;
    GET DIAGNOSTICS n = ROW_COUNT; IF n > 0 THEN RAISE NOTICE '%.%: % linha(s)', r.table_name, r.column_name, n; END IF;
  END LOOP;
  FOR r IN SELECT c.table_name, c.column_name FROM information_schema.columns c
           JOIN information_schema.tables t ON t.table_schema=c.table_schema AND t.table_name=c.table_name AND t.table_type='BASE TABLE'
           WHERE c.table_schema='public' AND c.table_name <> 'ofs' AND c.column_name IN ('of_numero','numero_of')
  LOOP
    EXECUTE format('DELETE FROM public.%I WHERE %I::text = $1', r.table_name, r.column_name) USING '4878';
    GET DIAGNOSTICS n = ROW_COUNT; IF n > 0 THEN RAISE NOTICE '%.%: % linha(s)', r.table_name, r.column_name, n; END IF;
  END LOOP;
  DELETE FROM public.ofs WHERE id::text = oid; GET DIAGNOSTICS n = ROW_COUNT; RAISE NOTICE 'ofs: % linha', n;
END $$;
SQL
sql -c "select count(*) as ofs_4878 from public.ofs where numero::text='4878';"
