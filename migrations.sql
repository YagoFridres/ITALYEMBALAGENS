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
