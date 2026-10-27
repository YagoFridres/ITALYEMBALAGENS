. deploy/lib.sh
# Colunas novas (devolutiva + andamento da compra) e as sugestões antigas (tabela sugestoes_compra) passam a aparecer junto das solicitações.
sql -c "alter table public.papelao_solicitacoes add column if not exists resposta text; alter table public.papelao_solicitacoes add column if not exists respondido_por text; alter table public.papelao_solicitacoes add column if not exists respondido_em timestamptz; alter table public.papelao_solicitacoes add column if not exists legado_id text;"
sql -c "alter table public.compras_chapas add column if not exists status_historico jsonb not null default '[]'::jsonb; alter table public.compras_chapas add column if not exists data_chegada date;"
sql -At -c "select status, count(*) from public.sugestoes_compra group by 1;" | tr '\n' ' '; echo
sql -c "insert into public.papelao_solicitacoes (chapa_id, fornecedor, nomenclatura, tamanho, descricao, observacao, status, solicitante, atualizado_por, resposta, respondido_por, respondido_em, legado_id, historico, created_at, updated_at)
select s.chapa_id::text, nullif(s.fornecedor,''), nullif(s.chapa_nome,''), nullif(s.tamanho,''), null, nullif(s.texto,''),
  case lower(s.status) when 'aceita' then 'Aceita' when 'ignorada' then 'Recusada' else 'Solicitada' end,
  s.criado_por, coalesce(s.decidido_por, s.criado_por), nullif(s.motivo_ignorado,''), s.decidido_por, s.decidido_em, s.id::text,
  jsonb_build_array(jsonb_build_object('em', s.criado_em, 'por', s.criado_por, 'status', 'Solicitada', 'obs', s.texto)),
  coalesce(s.criado_em, now()), coalesce(s.decidido_em, s.criado_em, now())
from public.sugestoes_compra s
where not exists (select 1 from public.papelao_solicitacoes p where p.legado_id = s.id::text)
  and not exists (select 1 from public.papelao_solicitacoes p where p.chapa_id = s.chapa_id::text and abs(extract(epoch from (p.created_at - s.criado_em))) < 300);"
sql -c "NOTIFY pgrst, 'reload schema';"
sql -At -c "select status, count(*) from public.papelao_solicitacoes group by 1;" | tr '\n' ' '
