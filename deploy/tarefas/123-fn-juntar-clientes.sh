#!/bin/bash
# Função para juntar dois cadastros de cliente (usada pela tela "Possíveis duplicados") — 12/11
source "$(dirname "$0")/../lib.sh"
sql <<'SQL'
CREATE TABLE IF NOT EXISTS public.clientes_bkp_juncoes AS SELECT * FROM public.clientes WHERE false;
CREATE OR REPLACE FUNCTION public.juntar_clientes(p_principal uuid, p_outro uuid, p_nome text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int; tot int := 0; r record; nomef text;
BEGIN
  IF p_principal IS NULL OR p_outro IS NULL OR p_principal = p_outro THEN RAISE EXCEPTION 'cadastros inválidos'; END IF;
  IF NOT EXISTS (SELECT 1 FROM clientes WHERE id = p_principal) OR NOT EXISTS (SELECT 1 FROM clientes WHERE id = p_outro) THEN RAISE EXCEPTION 'cadastro não encontrado'; END IF;
  INSERT INTO clientes_bkp_juncoes SELECT * FROM clientes WHERE id IN (p_principal, p_outro);
  nomef := coalesce(nullif(trim(p_nome),''), (SELECT nome FROM clientes WHERE id = p_principal));
  UPDATE clientes x SET
    nome = nomef,
    rs = coalesce(nullif(trim(x.rs),''), nullif(trim(y.rs),''), CASE WHEN y.nome <> nomef THEN y.nome END),
    cnpj = coalesce(nullif(trim(x.cnpj),''), y.cnpj), documento = coalesce(nullif(trim(x.documento),''), y.documento),
    tel = CASE WHEN coalesce(trim(x.tel),'') = '' THEN y.tel WHEN coalesce(trim(y.tel),'') = '' OR position(regexp_replace(y.tel,'\D','','g') in regexp_replace(x.tel,'\D','','g')) > 0 THEN x.tel ELSE x.tel || ' / ' || y.tel END,
    telefone = coalesce(nullif(trim(x.telefone),''), y.telefone), email = coalesce(nullif(trim(x.email),''), y.email),
    cidade = coalesce(nullif(trim(x.cidade),''), y.cidade), uf = coalesce(nullif(trim(x.uf),''), y.uf), endereco = coalesce(nullif(trim(x.endereco),''), y.endereco),
    ie = coalesce(nullif(trim(x.ie),''), y.ie), ramo = coalesce(nullif(trim(x.ramo),''), y.ramo), vendedor_id = coalesce(x.vendedor_id, y.vendedor_id),
    emp_id = coalesce(nullif(trim(x.emp_id),''), y.emp_id), observacoes = coalesce(nullif(trim(x.observacoes),''), y.observacoes), ativo = true, updated_at = now()
  FROM clientes y WHERE x.id = p_principal AND y.id = p_outro;
  FOR r IN SELECT c.table_name, c.column_name, c.data_type FROM information_schema.columns c JOIN information_schema.tables t ON t.table_schema=c.table_schema AND t.table_name=c.table_name AND t.table_type='BASE TABLE'
           WHERE c.table_schema='public' AND c.table_name NOT LIKE 'clientes%' AND c.column_name IN ('cliente_id','cli_id','cliid')
  LOOP
    IF r.data_type = 'uuid' THEN EXECUTE format('UPDATE public.%I SET %I = $1 WHERE %I = $2', r.table_name, r.column_name, r.column_name) USING p_principal, p_outro;
    ELSE EXECUTE format('UPDATE public.%I SET %I = $1 WHERE %I = $2', r.table_name, r.column_name, r.column_name) USING p_principal::text, p_outro::text; END IF;
    GET DIAGNOSTICS n = ROW_COUNT; tot := tot + n;
  END LOOP;
  UPDATE ofs SET cliente_nome = nomef, updated_at = now() WHERE cliente_id = p_principal AND coalesce(cliente_nome,'') <> nomef;
  GET DIAGNOSTICS n = ROW_COUNT;
  DELETE FROM clientes WHERE id = p_outro;
  RETURN jsonb_build_object('ok', true, 'nome', nomef, 'registros_movidos', tot, 'ofs_renomeadas', n);
END $$;
REVOKE ALL ON FUNCTION public.juntar_clientes(uuid, uuid, text) FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN EXECUTE 'GRANT EXECUTE ON FUNCTION public.juntar_clientes(uuid, uuid, text) TO service_role'; END IF;
END $$;
NOTIFY pgrst, 'reload schema';
SQL
sql -c "select proname from pg_proc where proname='juntar_clientes';"
