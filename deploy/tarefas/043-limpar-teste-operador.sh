. deploy/lib.sh
# Remove o teste do Modo Operador feito pelo Claude (OFs 4433/4434 "TESTE CLAUDE OPERADOR") para não distorcer a média real
sql -At -c "select id, numero from public.ofs where produto ilike 'TESTE CLAUDE OPERADOR%' or (itens::text ilike '%TESTE CLAUDE OPERADOR%');" 2>&1 | head
sql <<'SQL'
insert into public.sync_ignorar(tabela,id,motivo) select 'ofs', id::text, 'teste modo operador Claude 27/10' from public.ofs where itens::text ilike '%TESTE CLAUDE OPERADOR%' on conflict do nothing;
delete from public.tempos_reais where of_id in (select id::text from public.ofs where itens::text ilike '%TESTE CLAUDE OPERADOR%');
delete from public.producao_sessoes where of_id in (select id::text from public.ofs where itens::text ilike '%TESTE CLAUDE OPERADOR%');
delete from public.ofs where itens::text ilike '%TESTE CLAUDE OPERADOR%';
SQL
sql -At -c "select count(*) from public.producao_sessoes; select count(*) from public.tempos_reais;"
