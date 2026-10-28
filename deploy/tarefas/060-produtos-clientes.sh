. deploy/lib.sh
sql -c "alter table public.produtos_cadastro add column if not exists clientes jsonb not null default '[]'::jsonb; NOTIFY pgrst, 'reload schema';"
sql -At -c "select column_name from information_schema.columns where table_name='ofs' and column_name in ('sem_papel','sem_papelao','papel_comprado','previsao_entrega_papel');" | tr '\n' ' '
