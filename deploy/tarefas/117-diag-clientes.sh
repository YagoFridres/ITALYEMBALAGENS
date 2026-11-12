#!/bin/bash
# Diagnóstico (só leitura): colunas preenchidas no cadastro de clientes
source "$(dirname "$0")/../lib.sh"
sql <<'SQL'
DO $$ DECLARE r record; n int; tot int; BEGIN
  SELECT count(*) INTO tot FROM public.clientes; RAISE NOTICE 'total=%', tot;
  FOR r IN SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='clientes' ORDER BY ordinal_position LOOP
    EXECUTE format('SELECT count(*) FROM public.clientes WHERE %I IS NOT NULL AND trim(%I::text) NOT IN (%L,%L,%L)', r.column_name, r.column_name, '', '[]', '{}') INTO n;
    RAISE NOTICE '% (%) = %', r.column_name, r.data_type, n;
  END LOOP;
END $$;
SQL
sql -c "select count(*) filter (where coalesce(tel,'')='' and coalesce(telefone,'')<>'') as so_telefone, count(*) filter (where coalesce(telefone,'')='' and coalesce(tel,'')<>'') as so_tel, count(*) filter (where coalesce(tel,'')<>'' and coalesce(telefone,'')<>'' and tel<>telefone) as tel_diferente from public.clientes;" 2>&1 | tail -4
sql -c "select count(*) filter (where coalesce(cnpj,'')='' and coalesce(documento,'')<>'') as so_documento, count(*) filter (where coalesce(endereco,'')='' and coalesce(\"end\",'')<>'') as so_end, count(*) filter (where coalesce(observacoes,'')='' and coalesce(obs,'')<>'') as so_obs from public.clientes;" 2>&1 | tail -4
