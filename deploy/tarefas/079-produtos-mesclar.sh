. deploy/lib.sh
sql -c "alter table public.produtos_cadastro add column if not exists aliases jsonb default '[]'::jsonb;"
sql -c "alter table public.produtos_cadastro add column if not exists mesclados jsonb default '[]'::jsonb;"
sql -c "select count(*) from public.produtos_cadastro;"
recarregar_api
