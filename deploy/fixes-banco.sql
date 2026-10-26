-- Correções de banco aplicadas no teste (e a aplicar na produção com aprovação).
-- Reaplicadas automaticamente depois de cada cópia de dados (sync-dados.sh).
create table if not exists public.pedidos_recorrentes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid,
  descricao text default '',
  quantidade integer default 0,
  onda text,
  comprimento_mm integer,
  largura_mm integer,
  altura_mm integer,
  dia_do_mes integer default 1,
  ativo boolean default true,
  antecedencia_dias integer default 3,
  emp_id text,
  empresa_id uuid,
  criado_por text,
  created_at timestamptz default now(),
  updated_at timestamptz,
  ultima_geracao date
);
alter table public.inconformidades
  add column if not exists caixas_perdidas integer,
  add column if not exists qtd_perdida integer,
  add column if not exists vl_total numeric,
  add column if not exists valor_perdido numeric,
  add column if not exists valor_unitario numeric,
  add column if not exists operadores jsonb,
  add column if not exists operador_principal text,
  add column if not exists operador_nome text,
  add column if not exists operador text,
  add column if not exists maquinas jsonb,
  add column if not exists maquina text,
  add column if not exists produto text,
  add column if not exists cliente text,
  add column if not exists motivo text,
  add column if not exists descricao text,
  add column if not exists obs text,
  add column if not exists usuario text,
  add column if not exists saiu_em timestamptz,
  add column if not exists status text,
  add column if not exists imagem_url text,
  add column if not exists emp_id text,
  add column if not exists empresa_id uuid,
  add column if not exists of_numero text;
alter table public.tipos_caixa
  add column if not exists empresa_id uuid,
  add column if not exists emp_id text,
  add column if not exists observacoes text;
grant all on public.pedidos_recorrentes to anon, authenticated, service_role;
