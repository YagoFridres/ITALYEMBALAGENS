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
-- Modo operador (sessões de produção) e sequência manual das OFs por máquina (26/10/2026)
create table if not exists public.producao_sessoes (
  id uuid primary key default gen_random_uuid(),
  of_id text not null,
  of_numero text,
  maquina text not null,
  operador text,
  operador_fim text,
  inicio timestamptz not null default now(),
  fim timestamptz,
  minutos integer,
  quantidade integer,
  status text not null default 'aberta',
  status_anterior text,
  created_at timestamptz default now()
);
create index if not exists producao_sessoes_maq_idx on public.producao_sessoes (maquina, status);
create table if not exists public.sequenciamento_manual (
  of_id text not null,
  maquina text not null,
  posicao integer not null default 0,
  updated_at timestamptz default now(),
  primary key (of_id, maquina)
);
alter table public.ofs add column if not exists prioridade_producao integer;
create table if not exists public.tempos_reais (
  id uuid primary key default gen_random_uuid(),
  maquina_id text,
  maquina_nome text,
  of_id text,
  tipo_caixa text,
  velocidade_cxh integer,
  quantidade integer,
  setup_min integer,
  producao_min integer,
  data date,
  obs text,
  created_at timestamptz default now()
);
grant all on public.producao_sessoes, public.sequenciamento_manual, public.tempos_reais to anon, authenticated, service_role;
-- Tempos Reais: a tela usa estas colunas, mas a tabela só tinha id/maquina_id/of_id/tempo_minutos (26/10/2026)
alter table public.tempos_reais alter column maquina_id type text using maquina_id::text;
alter table public.tempos_reais alter column of_id type text using of_id::text;
alter table public.tempos_reais
  add column if not exists maquina_nome text,
  add column if not exists tipo_caixa text,
  add column if not exists velocidade_cxh integer,
  add column if not exists quantidade integer,
  add column if not exists setup_min integer,
  add column if not exists producao_min integer,
  add column if not exists data date,
  add column if not exists obs text;
