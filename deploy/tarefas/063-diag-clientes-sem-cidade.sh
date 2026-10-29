. deploy/lib.sh
sql <<'SQL'
\echo '== colunas de clientes =='
select string_agg(column_name, ', ' order by ordinal_position) from information_schema.columns where table_schema='public' and table_name='clientes';
\echo '== colunas de ofs com cidade/uf =='
select string_agg(column_name, ', ') from information_schema.columns where table_schema='public' and table_name='ofs' and (column_name ilike '%cid%' or column_name ilike '%uf%' or column_name ilike '%estado%' or column_name ilike '%end%');
\echo '== clientes sem cidade: totais =='
select count(*) total, count(*) filter (where coalesce(trim(endereco),'')<>'') com_endereco, count(*) filter (where coalesce(trim(uf),'')<>'') com_uf, count(*) filter (where ativo is false) inativos from public.clientes where coalesce(trim(cidade),'')='';
\echo '== amostra sem cidade (nome | endereco | uf | cnpj | ramo) =='
select nome || ' | ' || coalesce(endereco,'') || ' | ' || coalesce(uf,'') || ' | ' || coalesce(cnpj,'') || ' | ' || coalesce(ramo,'') from public.clientes where coalesce(trim(cidade),'')='' order by nome limit 60;
\echo '== ramos distintos nos clientes =='
select coalesce(ramo,'(vazio)') || ' = ' || count(*) from public.clientes group by ramo order by count(*) desc;
\echo '== ramos cadastrados =='
select string_agg(nome, ', ' order by nome) from public.ramos_atividade;
SQL
