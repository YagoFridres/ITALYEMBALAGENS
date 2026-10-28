. deploy/lib.sh
# Só leitura: OFs antigas no formato "Nº 315"
L="315,316,317,318,420,432,433,434,462,463,464,465,466,523,524,525,473"
sql -At -F ' | ' -c "select id, of, status, coalesce(clinome,cliente_nome), left(coalesce(descricao,''),40), qtd, ent, deleted_at is not null, emp_id, created_at::date from public.ofs where nullif(regexp_replace(of,'\D','','g'),'')::bigint in ($L) and of !~ '^[0-9]+$' order by nullif(regexp_replace(of,'\D','','g'),'')::bigint, emp_id;"
