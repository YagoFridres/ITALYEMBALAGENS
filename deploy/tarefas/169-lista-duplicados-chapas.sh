#!/usr/bin/env bash
# 25/11: lista lançamentos de chapas duplicados automaticamente (só leitura)
# par = mesma chapa, mesmo delta, mesma origem, mesmo usuário, até 15 s depois
source deploy/lib.sh
sql <<'SQL'
\pset format unaligned
\pset fieldsep '|'
select to_char(a.created_at at time zone 'America/Sao_Paulo','DD/MM/YY HH24:MI:SS') as primeiro,
       round(extract(epoch from (b.created_at - a.created_at))::numeric,1) as seg,
       coalesce(c.fornecedor,'') as forn, coalesce(c.nomenclatura,'') as nom, coalesce(c.tamanho,'') as tam, coalesce(c.categoria,'') as cat,
       a.delta, a.origem, coalesce(a.usuario,'') as usr, coalesce(a.nf,'') as nf,
       a.reverted as rev1, b.reverted as rev2, b.id as id_dup, a.id as id_orig,
       coalesce(c.quantidade_atual, c.quantidade) as saldo_hoje
from chapas_estoque_movimentos_v2 a
join chapas_estoque_movimentos_v2 b
  on b.chapa_id = a.chapa_id and b.delta = a.delta and coalesce(b.origem,'') = coalesce(a.origem,'')
 and coalesce(b.usuario,'') = coalesce(a.usuario,'')
 and b.created_at > a.created_at and b.created_at <= a.created_at + interval '15 seconds'
 and b.id <> a.id
left join chapas_estoque_v2 c on c.id = a.chapa_id
where coalesce(a.origem,'') not in ('reversao_movimento')
order by a.created_at;
SQL
