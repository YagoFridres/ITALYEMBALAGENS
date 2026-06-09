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

create table if not exists public.configuracoes (
  id uuid primary key default gen_random_uuid(),
  chave text not null unique,
  valor jsonb,
  atualizado_por text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.cotacoes (
  id uuid primary key default gen_random_uuid(),
  item text not null,
  quantidade integer,
  emp_id text,
  fornecedor_ids jsonb,
  propostas jsonb,
  escolhido_fornecedor_id uuid,
  criado_por text,
  created_at timestamptz not null default now()
);

create table if not exists public.avaliacoes_fornecedor (
  id uuid primary key default gen_random_uuid(),
  fornecedor_id uuid not null,
  compra_id uuid,
  prazo integer,
  qualidade integer,
  preco integer,
  criado_por text,
  created_at timestamptz not null default now()
);

create index if not exists avaliacoes_fornecedor_fornecedor_id_idx on public.avaliacoes_fornecedor (fornecedor_id, created_at desc);

alter table if exists public.orcamentos add column if not exists public_token text;
alter table if exists public.orcamentos add column if not exists public_aprovacao text;
alter table if exists public.orcamentos add column if not exists public_aprovacao_em timestamptz;
alter table if exists public.orcamentos add column if not exists public_aprovacao_obs text;

create index if not exists orcamentos_public_token_idx on public.orcamentos (public_token);

create table if not exists public.orcamentos_versoes (
  id uuid primary key default gen_random_uuid(),
  orcamento_id uuid not null,
  versao integer not null,
  snapshot jsonb,
  criado_por text,
  created_at timestamptz not null default now()
);

create index if not exists orcamentos_versoes_orcamento_id_idx on public.orcamentos_versoes (orcamento_id, versao desc);

alter table if exists public.amostras add column if not exists of_id uuid;
alter table if exists public.amostras add column if not exists of_numero text;
alter table if exists public.amostras add column if not exists of_criada_em timestamptz;

alter table if exists public.clientes add column if not exists ramo text;
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'clientes'
      and column_name = 'ramo_atividade'
  ) then
    execute 'update public.clientes set ramo = ramo_atividade where ramo is null and ramo_atividade is not null';
  end if;
end $$;

alter table if exists public.maquinas add column if not exists meta_perda_pct numeric;

create table if not exists public.estoque_tintas (
  id uuid default gen_random_uuid() primary key,
  empresa_id uuid references public.empresas(id),
  nome text not null,
  cor text,
  fornecedor text,
  unidade text default 'kg',
  quantidade_atual numeric default 0,
  quantidade_minima numeric default 0,
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.estoque_tintas_movimentos (
  id uuid default gen_random_uuid() primary key,
  empresa_id uuid references public.empresas(id),
  tinta_id uuid not null references public.estoque_tintas(id) on delete cascade,
  tipo text not null,
  delta numeric not null default 0,
  qtd_anterior numeric,
  qtd_nova numeric,
  obs text,
  criado_por text,
  created_at timestamptz default now()
);

create index if not exists estoque_tintas_movimentos_tinta_id_idx on public.estoque_tintas_movimentos (tinta_id, created_at desc);

create table if not exists public.estoque_materiais (
  id uuid default gen_random_uuid() primary key,
  empresa_id uuid references public.empresas(id),
  categoria text not null,
  nome text not null,
  unidade text default 'un',
  quantidade_atual numeric default 0,
  quantidade_minima numeric default 0,
  fornecedor text,
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.estoque_materiais_movimentos (
  id uuid default gen_random_uuid() primary key,
  empresa_id uuid references public.empresas(id),
  material_id uuid not null references public.estoque_materiais(id) on delete cascade,
  tipo text not null,
  delta numeric not null default 0,
  qtd_anterior numeric,
  qtd_nova numeric,
  obs text,
  criado_por text,
  created_at timestamptz default now()
);

create index if not exists estoque_materiais_movimentos_material_id_idx on public.estoque_materiais_movimentos (material_id, created_at desc);

alter table if exists public.facas_estoque
  add column if not exists tipo_corte text,
  add column if not exists maquinas jsonb default '[]';

alter table if exists public.cliches_estoque
  add column if not exists tipo_corte text,
  add column if not exists maquinas jsonb default '[]';

alter table if exists public.facas_estoque
  add column if not exists localizacao_fisica text,
  add column if not exists data_fabricacao date,
  add column if not exists vida_util_dias integer default 730;

alter table if exists public.estoque_tintas
  add column if not exists preco_kg numeric default 0,
  add column if not exists data_validade date;

alter table if exists public.estoque_tintas_movimentos
  add column if not exists of_id uuid,
  add column if not exists of_numero text,
  add column if not exists valor_unitario numeric;

alter table if exists public.estoque_materiais_movimentos
  add column if not exists of_id uuid,
  add column if not exists of_numero text,
  add column if not exists valor_unitario numeric;
