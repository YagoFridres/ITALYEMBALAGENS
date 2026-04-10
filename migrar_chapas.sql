create extension if not exists pgcrypto;

create table if not exists public.chapas_estoque_v2 (
  id uuid primary key default gen_random_uuid(),
  fornecedor text not null,
  nomenclatura text not null,
  tamanho text not null,
  nome_uso text not null,
  empresa_vinculada text,
  qual_cnpj text,
  nf text,
  quantidade integer not null default 0,
  valor_unitario numeric not null default 0,
  valor_total numeric generated always as (quantidade * valor_unitario) stored,
  categoria text not null,
  vincos text,
  observacao text,
  cliente_id uuid references public.clientes(id) on delete set null,
  cliente_nome text,
  riscada boolean not null default false,
  risca_desc text,
  estoque_minimo integer not null default 200,
  data_entrada date,
  emp_id text,
  criado_por text,
  atualizado_por text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chapas_estoque_v2_quantidade_nonneg check (quantidade >= 0),
  constraint chapas_estoque_v2_valor_nonneg check (valor_unitario >= 0)
);

alter table public.chapas_estoque_v2 add column if not exists empresa_vinculada text;

create index if not exists chapas_estoque_v2_categoria_idx on public.chapas_estoque_v2 (categoria);
create index if not exists chapas_estoque_v2_fornecedor_idx on public.chapas_estoque_v2 (fornecedor);
create index if not exists chapas_estoque_v2_nomenclatura_idx on public.chapas_estoque_v2 (nomenclatura);
create index if not exists chapas_estoque_v2_tamanho_idx on public.chapas_estoque_v2 (tamanho);
create index if not exists chapas_estoque_v2_nf_idx on public.chapas_estoque_v2 (nf);
create index if not exists chapas_estoque_v2_cliente_nome_idx on public.chapas_estoque_v2 (cliente_nome);
create index if not exists chapas_estoque_v2_riscada_idx on public.chapas_estoque_v2 (riscada);
create index if not exists chapas_estoque_v2_emp_id_idx on public.chapas_estoque_v2 (emp_id);
create index if not exists chapas_estoque_v2_empresa_vinculada_idx on public.chapas_estoque_v2 (empresa_vinculada);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_chapas_estoque_v2 on public.chapas_estoque_v2;
create trigger set_updated_at_chapas_estoque_v2
before update on public.chapas_estoque_v2
for each row execute function public.set_updated_at();

create table if not exists public.chapas_estoque_movimentos_v2 (
  id uuid primary key default gen_random_uuid(),
  chapa_id uuid not null references public.chapas_estoque_v2(id) on delete cascade,
  tipo text not null,
  delta integer not null default 0,
  qtd_anterior integer not null,
  qtd_nova integer not null,
  nf text,
  obs text,
  usuario text,
  emp_id text,
  reverted boolean not null default false,
  reverted_by text,
  reverted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint chapas_estoque_movimentos_v2_qtd_nonneg check (qtd_anterior >= 0 and qtd_nova >= 0)
);

create index if not exists chapas_estoque_movimentos_v2_chapa_id_idx on public.chapas_estoque_movimentos_v2 (chapa_id, created_at desc);
create index if not exists chapas_estoque_movimentos_v2_reverted_idx on public.chapas_estoque_movimentos_v2 (reverted, created_at desc);
