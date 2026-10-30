. deploy/lib.sh
# A empresa escolhida na OF (emp_id E1/E2/E3) é a correta (decisão do Yago, 30/10).
# 1) cópia de segurança  2) alinha empresa_id ao emp_id  3) gatilho para não divergir mais
sql <<'SQL'
create table if not exists public.bkp_ofs_empresa_20261030 as
  select id, of, empresa_id, emp_id, now() as copiado_em from public.ofs;
\echo '== backup =='
select count(*) from public.bkp_ofs_empresa_20261030;

create or replace function public.ofs_alinhar_empresa() returns trigger language plpgsql as $f$
declare s text := upper(trim(coalesce(new.emp_id,'')));
begin
  if s in ('ITALY','ITALY EMBALAGENS') then s := 'E1'; new.emp_id := 'E1'; end if;
  if s = 'E1' then new.empresa_id := 'df5f7672-0a6b-402d-ae65-296554236c31';
  elsif s = 'E2' then new.empresa_id := 'e9b734dc-c7d5-4b04-898d-1ec7affa721e';
  elsif s = 'E3' then new.empresa_id := 'a6e5f5d8-4743-4ebe-885e-c2f0741a667a';
  else
    if new.empresa_id::text = 'a6e5f5d8-4743-4ebe-885e-c2f0f741a667' then new.empresa_id := 'a6e5f5d8-4743-4ebe-885e-c2f0741a667a'; end if;
    if new.empresa_id::text = 'df5f7672-0a6b-402d-ae65-296554236c31' then new.emp_id := 'E1';
    elsif new.empresa_id::text = 'e9b734dc-c7d5-4b04-898d-1ec7affa721e' then new.emp_id := 'E2';
    elsif new.empresa_id::text = 'a6e5f5d8-4743-4ebe-885e-c2f0741a667a' then new.emp_id := 'E3';
    end if;
  end if;
  return new;
end $f$;
drop trigger if exists trg_ofs_alinhar_empresa on public.ofs;
create trigger trg_ofs_alinhar_empresa before insert or update of emp_id, empresa_id on public.ofs
  for each row execute function public.ofs_alinhar_empresa();

\echo '== OFs que serao alinhadas =='
select count(*) from public.ofs where
  (upper(coalesce(emp_id,'')) in ('E1','ITALY') and empresa_id::text is distinct from 'df5f7672-0a6b-402d-ae65-296554236c31')
  or (upper(coalesce(emp_id,'')) = 'E2' and empresa_id::text is distinct from 'e9b734dc-c7d5-4b04-898d-1ec7affa721e')
  or (upper(coalesce(emp_id,'')) = 'E3' and empresa_id::text is distinct from 'a6e5f5d8-4743-4ebe-885e-c2f0741a667a')
  or (coalesce(emp_id,'') = '' and empresa_id is not null);
update public.ofs set emp_id = emp_id where
  (upper(coalesce(emp_id,'')) in ('E1','ITALY') and empresa_id::text is distinct from 'df5f7672-0a6b-402d-ae65-296554236c31')
  or (upper(coalesce(emp_id,'')) = 'E2' and empresa_id::text is distinct from 'e9b734dc-c7d5-4b04-898d-1ec7affa721e')
  or (upper(coalesce(emp_id,'')) = 'E3' and empresa_id::text is distinct from 'a6e5f5d8-4743-4ebe-885e-c2f0741a667a')
  or (coalesce(emp_id,'') = '' and empresa_id is not null);

\echo '== depois: todas as OFs empresa_id x emp_id =='
select coalesce(e.nome, o.empresa_id::text, '(nulo)') empresa, coalesce(o.emp_id,'(nulo)') emp_id, count(*)
from public.ofs o left join public.empresas e on e.id::text = o.empresa_id::text
where o.deleted_at is null group by 1,2 order by 1,2;
SQL
recarregar_api
