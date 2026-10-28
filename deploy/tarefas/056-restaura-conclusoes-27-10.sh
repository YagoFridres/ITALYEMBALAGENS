. deploy/lib.sh
# Restaura as conclusões feitas aqui em 27/10 que a sincronização (18:02/18:08) desfez.
# Critério: OF "Em aberto", sobrescrita pela sincronização (updated_at 27/10 21:00–21:05 UTC), com a passagem gerada
# pela conclusão aqui em 27/10 (depois da cópia das 10:58 e antes da sobrescrita) e todas as máquinas do fluxo passadas.
sql -At -F ' | ' <<'SQL'
create temp table rest as
select o.id, o.of, o.valor_total, lp.hora_passagem, lp.quantidade, lp.operador
from public.ofs o
join lateral (select p.hora_passagem, p.quantidade, p.operador from public.passagens_maquina p where p.of_id = o.id order by p.hora_passagem desc limit 1) lp on true
where o.deleted_at is null and o.status = 'Em aberto'
  and o.updated_at >= '2026-10-27 21:00+00' and o.updated_at < '2026-10-27 21:05+00'
  and lp.hora_passagem >= '2026-10-27 13:58+00' and lp.hora_passagem < '2026-10-27 21:02+00'
  and coalesce(jsonb_array_length(case when jsonb_typeof(o.fluxo_maquinas::jsonb)='array' then o.fluxo_maquinas::jsonb end),0)
      <= (select count(distinct p2.maquina) from public.passagens_maquina p2 where p2.of_id = o.id);
select 'a restaurar', count(*), round(sum(valor_total)::numeric,2) from rest;
select of, to_char(hora_passagem at time zone 'America/Sao_Paulo','DD/MM HH24:MI'), quantidade, operador, valor_total from rest order by of;
update public.ofs o set status = 'Concluído', data_conclusao = r.hora_passagem, caixas_boas = coalesce(o.caixas_boas, r.quantidade),
  usuario_conclusao = coalesce(o.usuario_conclusao, r.operador), updated_at = now()
from rest r where o.id = r.id;
select 'restauradas', count(*) from public.ofs where id in (select id from rest) and status = 'Concluído';
SQL
echo "## comissoes outubro depois da restauracao (concluidas com data_conclusao em out)"
sql -At -F ' | ' -c "select count(*), round(sum(valor_total)::numeric,2) from public.ofs where status ilike '%conclu%' and deleted_at is null and data_conclusao >= '2026-10-01' and data_conclusao < '2026-11-01';"
