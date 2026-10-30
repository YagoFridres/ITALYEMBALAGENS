. deploy/lib.sh
# Regra (Yago 30/10 13:36): a empresa pode ser trocada na conclusão; a da conclusão é a que vale.
# A conclusão grava só empresa_id -> o gatilho passa a derivar emp_id do empresa_id quando este muda.
sql <<'SQL'
create or replace function public.ofs_alinhar_empresa() returns trigger language plpgsql as $f$
declare
  s text; e text;
  uid_mudou boolean := (tg_op = 'UPDATE' and new.empresa_id is distinct from old.empresa_id);
  sig_mudou boolean := (tg_op = 'UPDATE' and new.emp_id is distinct from old.emp_id);
begin
  if new.empresa_id::text = 'a6e5f5d8-4743-4ebe-885e-c2f0f741a667' then new.empresa_id := 'a6e5f5d8-4743-4ebe-885e-c2f0741a667a'; end if;
  s := upper(trim(coalesce(new.emp_id,'')));
  if s in ('ITALY','ITALY EMBALAGENS') then s := 'E1'; end if;
  e := case new.empresa_id::text
         when 'df5f7672-0a6b-402d-ae65-296554236c31' then 'E1'
         when 'e9b734dc-c7d5-4b04-898d-1ec7affa721e' then 'E2'
         when 'a6e5f5d8-4743-4ebe-885e-c2f0741a667a' then 'E3' else '' end;
  -- empresa_id manda quando foi ele que mudou (conclusão), ou no insert quando existe
  if e <> '' and (uid_mudou or not sig_mudou or s = '') then
    new.emp_id := e;
  elsif s in ('E1','E2','E3') then
    new.emp_id := s;
    new.empresa_id := case s when 'E1' then 'df5f7672-0a6b-402d-ae65-296554236c31'
                             when 'E2' then 'e9b734dc-c7d5-4b04-898d-1ec7affa721e'
                             else 'a6e5f5d8-4743-4ebe-885e-c2f0741a667a' end;
  end if;
  return new;
end $f$;

\echo '== OFs alteradas na 071 (antes -> agora), por status =='
select coalesce(b.empresa_id::text,'(nulo)') antes_uuid, b.emp_id antes_sigla, o.emp_id agora,
       case when o.status ilike '%conclu%' then 'concluida' else coalesce(o.status,'?') end st, count(*)
from public.bkp_ofs_empresa_20261030 b join public.ofs o on o.id=b.id
where b.empresa_id is distinct from o.empresa_id group by 1,2,3,4 order by 5 desc;
\echo '== colunas de empresa na tabela ofs =='
select column_name from information_schema.columns where table_schema='public' and table_name='ofs' and column_name ilike '%emp%';
SQL
sql -c "select o.of, o.status, b.empresa_id antes_uuid, b.emp_id antes_sigla, o.\"empNome\" from public.bkp_ofs_empresa_20261030 b join public.ofs o on o.id=b.id where b.empresa_id is distinct from o.empresa_id and o.status ilike '%conclu%' and b.empresa_id is not null order by o.data_conclusao desc nulls last limit 25;" || true
sql -c "select coalesce(h.campo,'') , count(*) from public.ofs limit 0;" >/dev/null 2>&1 || true
recarregar_api
