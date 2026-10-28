. deploy/lib.sh
# Tabela do cadastro de Produtos
sql -c "create table if not exists public.produtos_cadastro (id uuid primary key default gen_random_uuid(), nome text not null, largura numeric, comprimento numeric, altura numeric, cliente_id text, cliente_nome text, observacao text, ativo boolean not null default true, criado_por text, created_at timestamptz default now(), updated_at timestamptz default now());"
sql -c "create index if not exists produtos_cadastro_nome_idx on public.produtos_cadastro (lower(nome)); grant all on public.produtos_cadastro to anon, authenticated, service_role; NOTIFY pgrst, 'reload schema';"
sql -At -c "select count(*) from public.produtos_cadastro;"
