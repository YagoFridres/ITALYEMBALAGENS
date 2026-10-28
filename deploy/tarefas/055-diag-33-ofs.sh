. deploy/lib.sh
# Só leitura: as 33 OFs abertas que já passaram por todas as máquinas — o que foi registrado nelas
sql -At -F ' | ' <<'SQL'
with x as (select o.* from public.ofs o where o.deleted_at is null and o.status not ilike '%conclu%' and o.status not ilike '%cancel%'
  and exists (select 1 from public.passagens_maquina p where p.of_id=o.id and p.data_passagem >= '2026-10-01'))
select x.of, x.status, x.passou_maquina, x.passou_em, x.data_conclusao, x.caixas_boas, x.usuario_conclusao, x.updated_at,
 (select string_agg(p.maquina||'@'||to_char(p.hora_passagem at time zone 'America/Sao_Paulo','DD/MM HH24:MI')||' st='||coalesce(p.status,'')||' op='||coalesce(p.operador,'')||' q='||coalesce(p.quantidade::text,''), ' ; ' order by p.hora_passagem) from public.passagens_maquina p where p.of_id=x.id)
from x order by x.of;
SQL
echo "## status distintos em passagens_maquina (out)"
sql -At -F ' | ' -c "select coalesce(status,'(nulo)'), count(*) from public.passagens_maquina where data_passagem >= '2026-10-01' group by 1 order by 2 desc;"
echo "## historico_acoes dessas OFs"
sql -At -F ' | ' -c "select string_agg(distinct column_name, ',') from information_schema.columns where table_name='historico_acoes';"
sql -At -F ' | ' <<'SQL'
select h.created_at at time zone 'America/Sao_Paulo', h.tipo_acao, left(h.descricao,90), h.usuario from public.historico_acoes h
where h.created_at >= '2026-10-01' and (h.descricao ~* '(3868|3672|4057|3879|3919|3920|4110|4119|3489)') order by h.created_at limit 40;
SQL
echo "## concluidas em out (todas as datas possiveis) sem canceladas"
sql -At -F ' | ' -c "select count(*), round(sum(valor_total)::numeric,2) from public.ofs where status ilike '%conclu%' and deleted_at is null and (data_conclusao >= '2026-10-01' or updated_at >= '2026-10-01 03:00+00') and coalesce(data_conclusao::date,'2026-10-01') < '2026-11-01';"
echo "## concluidas com data_conclusao em out"
sql -At -F ' | ' -c "select count(*), round(sum(valor_total)::numeric,2) from public.ofs where status ilike '%conclu%' and deleted_at is null and data_conclusao >= '2026-10-01' and data_conclusao < '2026-11-01';"
