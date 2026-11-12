#!/bin/bash
# Diagnóstico 2 (só leitura)
source "$(dirname "$0")/../lib.sh"
sql -c "select ativo, count(*) from public.clientes group by ativo;"
sql -c "select count(*) filter (where coalesce(cnpj,'')='' and coalesce(documento,'')<>'') as so_documento, count(*) filter (where coalesce(cnpj,'')<>'' and coalesce(documento,'')<>'' and regexp_replace(cnpj,'\D','','g')<>regexp_replace(documento,'\D','','g')) as doc_diferente from public.clientes;"
sql -c "select nome, tel, telefone, updated_at::date from public.clientes where coalesce(tel,'')<>'' and coalesce(telefone,'')<>'' and tel<>telefone order by updated_at desc limit 25;"
sql -c "select count(*) filter (where regexp_replace(tel,'\D','','g')=regexp_replace(telefone,'\D','','g')) as so_formato, count(*) as total from public.clientes where coalesce(tel,'')<>'' and coalesce(telefone,'')<>'' and tel<>telefone;"
sql -c "select count(*) as duplicados_nome from (select upper(trim(nome)) n, count(*) c from public.clientes where ativo group by 1 having count(*)>1) x;"
