-- Habilitar extensão UUID 
create extension if not exists pgcrypto; 
 
-- EMPRESAS (Italy, filiais, etc) 
create table if not exists empresas ( 
  id uuid primary key default gen_random_uuid(), 
  nome text not null, 
  sigla text not null, 
  cnpj text, 
  cor text default 'blue', 
  ativo boolean default true, 
  created_at timestamptz default now() 
); 
 
-- CLIENTES 
create table if not exists clientes ( 
  id uuid primary key default gen_random_uuid(), 
  codigo text unique not null, 
  nome text not null, 
  razao_social text, 
  cnpj text, 
  ie text, 
  telefone text, 
  email text, 
  cidade text, 
  uf text, 
  endereco text, 
  ramo text, 
  pagamento text, 
  representante text, 
  obs text, 
  empresa_id uuid references empresas(id), 
  ativo boolean default true, 
  created_at timestamptz default now(), 
  updated_at timestamptz default now() 
); 
 
-- MÁQUINAS 
create table if not exists maquinas ( 
  id uuid primary key default gen_random_uuid(), 
  nome text not null, 
  tipo text, 
  velocidade_media numeric default 0, 
  eficiencia numeric default 100, 
  ativo boolean default true, 
  created_at timestamptz default now() 
); 
 
-- FLUXOS DE PRODUÇÃO 
create table if not exists fluxos ( 
  id uuid primary key default gen_random_uuid(), 
  nome text not null, 
  etapas jsonb default '[]', 
  created_at timestamptz default now() 
); 
 
-- ESTOQUE (chapas, materiais) 
create table if not exists estoque ( 
  id uuid primary key default gen_random_uuid(), 
  codigo text unique not null, 
  descricao text not null, 
  tipo text, 
  unidade text default 'un', 
  quantidade numeric default 0, 
  quantidade_minima numeric default 0, 
  custo_unitario numeric default 0, 
  empresa_id uuid references empresas(id), 
  updated_at timestamptz default now(), 
  created_at timestamptz default now() 
); 
 
-- ORDENS DE FABRICAÇÃO (OFs) 
create table if not exists ofs ( 
  id uuid primary key default gen_random_uuid(), 
  numero text unique not null, 
  cliente_id uuid references clientes(id), 
  empresa_id uuid references empresas(id), 
  maquina_id uuid references maquinas(id), 
  fluxo_id uuid references fluxos(id), 
  status text default 'Em aberto', 
  data_entrega date, 
  data_producao date, 
  prioridade integer default 0, 
  urgente boolean default false, 
  quantidade integer default 0, 
  descricao text, 
  obs text, 
  itens jsonb default '[]', 
  created_at timestamptz default now(), 
  updated_at timestamptz default now() 
); 
 
-- APONTAMENTOS DE PRODUÇÃO 
create table if not exists apontamentos ( 
  id uuid primary key default gen_random_uuid(), 
  of_id uuid references ofs(id) on delete cascade, 
  maquina_id uuid references maquinas(id), 
  operador text, 
  status text default 'em_andamento', 
  inicio timestamptz default now(), 
  fim timestamptz, 
  quantidade_produzida integer default 0, 
  obs text, 
  created_at timestamptz default now() 
); 
 
-- TRIGGERS para updated_at 
create or replace function set_updated_at() 
returns trigger language plpgsql as $$ 
begin new.updated_at = now(); return new; end; $$; 
 
drop trigger if exists trg_clientes_upd on clientes; 
create trigger trg_clientes_upd before update on clientes 
  for each row execute function set_updated_at(); 
 
drop trigger if exists trg_ofs_upd on ofs; 
create trigger trg_ofs_upd before update on ofs 
  for each row execute function set_updated_at(); 
 
drop trigger if exists trg_estoque_upd on estoque; 
create trigger trg_estoque_upd before update on estoque 
  for each row execute function set_updated_at(); 
 
-- ROW LEVEL SECURITY 
alter table empresas enable row level security; 
alter table clientes enable row level security; 
alter table maquinas enable row level security; 
alter table fluxos enable row level security; 
alter table estoque enable row level security; 
alter table ofs enable row level security; 
alter table apontamentos enable row level security; 
 
-- Políticas: usuário autenticado acessa tudo 
create policy "auth_all" on empresas for all to authenticated using (true) with check (true); 
create policy "auth_all" on clientes for all to authenticated using (true) with check (true); 
create policy "auth_all" on maquinas for all to authenticated using (true) with check (true); 
create policy "auth_all" on fluxos for all to authenticated using (true) with check (true); 
create policy "auth_all" on estoque for all to authenticated using (true) with check (true); 
create policy "auth_all" on ofs for all to authenticated using (true) with check (true); 
create policy "auth_all" on apontamentos for all to authenticated using (true) with check (true); 
 
-- Habilitar Realtime 
alter table ofs replica identity full; 
alter table apontamentos replica identity full; 
alter table estoque replica identity full; 
alter publication supabase_realtime add table ofs; 
alter publication supabase_realtime add table apontamentos; 
alter publication supabase_realtime add table estoque; 
