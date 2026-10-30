. deploy/lib.sh
# Restaura a empresa da CONCLUSÃO nas OFs concluídas que a 071 trocou para a do lançamento.
sql <<'SQL'
\echo '== serao restauradas =='
select count(*) from public.bkp_ofs_empresa_20261030 b join public.ofs o on o.id=b.id
where o.status ilike '%conclu%' and b.empresa_id is not null
  and replace(b.empresa_id::text,'c2f0f741a667','c2f0741a667a') is distinct from o.empresa_id::text;
update public.ofs o set empresa_id = replace(b.empresa_id::text,'c2f0f741a667','c2f0741a667a')::uuid
from public.bkp_ofs_empresa_20261030 b
where o.id=b.id and o.status ilike '%conclu%' and b.empresa_id is not null
  and replace(b.empresa_id::text,'c2f0f741a667','c2f0741a667a') is distinct from o.empresa_id::text;
\echo '== conferencia: divergentes restantes (deve ser 0) =='
select count(*) from public.ofs where deleted_at is null and empresa_id is not null and
  emp_id is distinct from (case empresa_id::text when 'df5f7672-0a6b-402d-ae65-296554236c31' then 'E1' when 'e9b734dc-c7d5-4b04-898d-1ec7affa721e' then 'E2' when 'a6e5f5d8-4743-4ebe-885e-c2f0741a667a' then 'E3' end);
\echo '== exemplos =='
select of, emp_id, "empNome" from public.ofs where of in ('4133','4248','4326','4196','3676','4020') order by of;
SQL
recarregar_api
