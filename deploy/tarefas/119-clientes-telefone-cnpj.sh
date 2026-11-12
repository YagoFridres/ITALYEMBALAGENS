#!/bin/bash
# Clientes: telefone e CNPJ que estavam só nas colunas antigas (telefone/documento) passam a aparecer (12/11)
source "$(dirname "$0")/../lib.sh"
sql -c "create table if not exists public.clientes_bkp_20261112 as select id, tel, telefone, cnpj, documento from public.clientes;"
sql <<'SQL'
BEGIN;
-- só tinha no "telefone": copia para o campo que a tela usa
UPDATE public.clientes SET tel = telefone WHERE coalesce(trim(tel),'') = '' AND coalesce(trim(telefone),'') <> '';
-- dois números diferentes: guarda os dois
UPDATE public.clientes SET tel = tel || ' / ' || telefone
 WHERE coalesce(trim(tel),'') <> '' AND coalesce(trim(telefone),'') <> ''
   AND regexp_replace(tel,'\D','','g') <> regexp_replace(telefone,'\D','','g')
   AND position(regexp_replace(telefone,'\D','','g') in regexp_replace(tel,'\D','','g')) = 0;
UPDATE public.clientes SET telefone = tel WHERE coalesce(trim(tel),'') <> '' AND coalesce(telefone,'') <> tel;
-- CNPJ só no "documento"
UPDATE public.clientes SET cnpj = documento WHERE coalesce(trim(cnpj),'') = '' AND coalesce(trim(documento),'') <> '';
UPDATE public.clientes SET documento = cnpj WHERE coalesce(trim(cnpj),'') <> '' AND coalesce(documento,'') <> cnpj;
COMMIT;
SQL
sql -c "select count(*) filter (where coalesce(tel,'')<>'') as com_telefone, count(*) filter (where coalesce(cnpj,'')<>'') as com_cnpj, count(*) filter (where tel like '% / %') as dois_numeros, count(*) as total from public.clientes;"
