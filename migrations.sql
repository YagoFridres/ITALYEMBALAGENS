alter table if exists public.chapas_estoque add column if not exists foto_url text;
alter table if exists public.facas_estoque add column if not exists foto_url text;
alter table if exists public.cliches_estoque add column if not exists foto_url text;

create table if not exists public.chapas_estoque_movimentos (
  id uuid primary key default gen_random_uuid(),
  chapa_id uuid not null,
  tipo text not null,
  delta integer not null default 0,
  qtd_anterior integer,
  qtd_nova integer,
  nf text,
  obs text,
  usuario text,
  emp_id text,
  valor_unitario numeric,
  created_at timestamptz not null default now()
);

create index if not exists chapas_estoque_movimentos_chapa_id_idx on public.chapas_estoque_movimentos (chapa_id, created_at desc);

alter table if exists public.chapas_estoque_movimentos_v2 add column if not exists valor_unitario numeric;
