. deploy/lib.sh
sql <<'SQL'
\echo '== tipos de caixa =='
select id, nome from public.tipos_caixa order by nome;
\echo '== OFs concluidas por tipo_caixa (texto) =='
select coalesce(tipo_caixa,'(nulo)') tipo, count(*) from public.ofs where deleted_at is null and status ilike '%conclu%' group by 1 order by 2 desc limit 40;
\echo '== OFs com tipo_caixa_id =='
select count(*) total, count(tipo_caixa_id) com_id, count(nullif(tipo_caixa,'')) com_txt from public.ofs where deleted_at is null and status ilike '%conclu%';
\echo '== descricoes com pizza/salgad =='
select count(*) filter (where descricao ilike '%pizza%') pizza_desc, count(*) filter (where descricao ilike '%salgad%') salg_desc from public.ofs where deleted_at is null and status ilike '%conclu%';
\echo '== ramos dos clientes =='
select coalesce(ramo,'(nulo)'), count(*) from public.clientes group by 1 order by 2 desc limit 25;
SQL
