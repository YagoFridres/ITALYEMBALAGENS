create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  role text not null check (role in ('admin','producao','estoque','vendas','financeiro')),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_app_users_updated_at on app_users;
create trigger trg_app_users_updated_at
before update on app_users
for each row execute function set_updated_at();

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cidade text,
  uf text,
  tel text,
  email text,
  end text,
  obs text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_clientes_updated_at on clientes;
create trigger trg_clientes_updated_at
before update on clientes
for each row execute function set_updated_at();

create table if not exists fornecedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text,
  tel text,
  email text,
  cidade text,
  uf text,
  end text,
  obs text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_fornecedores_updated_at on fornecedores;
create trigger trg_fornecedores_updated_at
before update on fornecedores
for each row execute function set_updated_at();

create table if not exists vendedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tel text,
  email text,
  reg text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_vendedores_updated_at on vendedores;
create trigger trg_vendedores_updated_at
before update on vendedores
for each row execute function set_updated_at();

create table if not exists operadores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  setor text,
  mat text,
  ativo boolean not null default true,
  obs text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_operadores_updated_at on operadores;
create trigger trg_operadores_updated_at
before update on operadores
for each row execute function set_updated_at();

create table if not exists chapas (
  id uuid primary key default gen_random_uuid(),
  codigo text,
  forn text,
  nom text,
  tam text,
  comp numeric,
  larg numeric,
  nome text,
  qual text,
  nf text,
  qtd numeric not null default 0,
  val numeric not null default 0,
  min numeric not null default 0,
  vincada boolean not null default false,
  vincos text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_chapas_updated_at on chapas;
create trigger trg_chapas_updated_at
before update on chapas
for each row execute function set_updated_at();

alter table app_users enable row level security;
alter table clientes enable row level security;
alter table fornecedores enable row level security;
alter table vendedores enable row level security;
alter table operadores enable row level security;
alter table chapas enable row level security;

create policy "app_users: self read"
on app_users for select
to authenticated
using (id = auth.uid());

create policy "app_users: admin read all"
on app_users for select
to authenticated
using (
  exists (
    select 1 from app_users u
    where u.id = auth.uid() and u.role = 'admin' and u.ativo = true
  )
);

create policy "app_users: admin update"
on app_users for update
to authenticated
using (
  exists (
    select 1 from app_users u
    where u.id = auth.uid() and u.role = 'admin' and u.ativo = true
  )
);

create policy "clientes: read"
on clientes for select
to authenticated
using (true);

create policy "clientes: write admin"
on clientes for all
to authenticated
using (
  exists (select 1 from app_users u where u.id = auth.uid() and u.role = 'admin' and u.ativo = true)
)
with check (
  exists (select 1 from app_users u where u.id = auth.uid() and u.role = 'admin' and u.ativo = true)
);

create policy "fornecedores: read"
on fornecedores for select
to authenticated
using (true);

create policy "fornecedores: write admin"
on fornecedores for all
to authenticated
using (
  exists (select 1 from app_users u where u.id = auth.uid() and u.role = 'admin' and u.ativo = true)
)
with check (
  exists (select 1 from app_users u where u.id = auth.uid() and u.role = 'admin' and u.ativo = true)
);

create policy "vendedores: read"
on vendedores for select
to authenticated
using (true);

create policy "vendedores: write admin"
on vendedores for all
to authenticated
using (
  exists (select 1 from app_users u where u.id = auth.uid() and u.role = 'admin' and u.ativo = true)
)
with check (
  exists (select 1 from app_users u where u.id = auth.uid() and u.role = 'admin' and u.ativo = true)
);

create policy "operadores: read"
on operadores for select
to authenticated
using (true);

create policy "operadores: write admin"
on operadores for all
to authenticated
using (
  exists (select 1 from app_users u where u.id = auth.uid() and u.role = 'admin' and u.ativo = true)
)
with check (
  exists (select 1 from app_users u where u.id = auth.uid() and u.role = 'admin' and u.ativo = true)
);

create policy "chapas: read"
on chapas for select
to authenticated
using (true);

create policy "chapas: write admin or estoque"
on chapas for all
to authenticated
using (
  exists (
    select 1 from app_users u
    where u.id = auth.uid() and u.ativo = true and u.role in ('admin','estoque')
  )
)
with check (
  exists (
    select 1 from app_users u
    where u.id = auth.uid() and u.ativo = true and u.role in ('admin','estoque')
  )
);
