. deploy/lib.sh
sql -c "alter table public.produtos_cadastro add column if not exists cores jsonb not null default '[]'::jsonb; NOTIFY pgrst, 'reload schema';"
