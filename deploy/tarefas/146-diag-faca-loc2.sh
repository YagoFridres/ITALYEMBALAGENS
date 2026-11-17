#!/bin/bash
# Diagnóstico (somente leitura): permissões e teste do update da localizacao como o papel da API — 17/11
source "$(dirname "$0")/../lib.sh"
sql -c "select grantee, privilege_type from information_schema.column_privileges where table_name='facas_estoque' and column_name='localizacao' order by 1,2" 2>&1
sql -c "select grantee, privilege_type from information_schema.role_table_grants where table_name='facas_estoque' order by 1,2" 2>&1
sql -c "select polname, cmd, qual, with_check from pg_policies p join pg_policy x on x.polname=p.policyname where p.tablename='facas_estoque'" 2>&1 | head -20
sql <<'SQL' 2>&1
begin;
set local role service_role;
update facas_estoque set localizacao='TESTE ROLE' where id='1484e63b-bb26-4a07-ba4c-63ee9913c0aa' returning localizacao;
rollback;
SQL
$DC logs --tail=15 rest 2>&1 | cut -c1-250
