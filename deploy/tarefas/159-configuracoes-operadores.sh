#!/usr/bin/env bash
# 18/11: tabela de configurações (chave/valor) + operadores de cada máquina para a conclusão de OF
source deploy/lib.sh
sql <<'SQL'
create table if not exists public.configuracoes (
  chave text primary key,
  valor jsonb,
  atualizado_por text,
  updated_at timestamptz default now()
);
grant all on public.configuracoes to service_role;
grant select, insert, update on public.configuracoes to authenticated;
insert into public.configuracoes (chave, valor, atualizado_por, updated_at) values ('operadores_por_maquina', '{
  "IMP 01": ["Jéssicazinha"],
  "IMP 02": ["Rubens, Douglas"],
  "IMP 03": ["Leandro"],
  "IMP 04": ["Hércules, Thiago"],
  "IMP 05": ["Claci", "Jéssicazinha"],
  "RISCADOR": ["Jéssica Riscador"],
  "CORTE VINCO ROTATIVA": ["Claci", "Andreia"],
  "ACABAMENTO": ["Maria Acabamento, Sérgio", "Valmir, Rosana"]
}'::jsonb, 'configuração inicial', now())
on conflict (chave) do update set valor = excluded.valor, atualizado_por = excluded.atualizado_por, updated_at = now();
select chave, valor from public.configuracoes;
SQL
recarregar_api
