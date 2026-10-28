. deploy/lib.sh
# Só leitura: por que Passagens (out/2026) mostra mais OFs e mais valor que Comissões
Q() { echo "## $1"; sql -At -F ' | ' -c "$2"; }
Q "colunas passagens_maquina" "select string_agg(column_name||':'||data_type, ', ' order by ordinal_position) from information_schema.columns where table_name='passagens_maquina';"
Q "passagens em out (linhas, ofs distintas por of_id, sem of_id)" "select count(*), count(distinct of_id), count(*) filter (where of_id is null) from public.passagens_maquina where data_passagem >= '2026-10-01' and data_passagem < '2026-11-01';"
cat > /tmp/pm.sql <<'SQL'
create temp view pm as select distinct on (coalesce(p.of_id::text, 'n:'||p.of_numero::text)) coalesce(p.of_id::text, 'n:'||p.of_numero::text) k, p.of_id, p.of_numero from public.passagens_maquina p where p.data_passagem >= '2026-10-01' and p.data_passagem < '2026-11-01';
create temp view o as select *, coalesce(data_conclusao::date, data_faturamento::date, created_at::date) dr from public.ofs;
select '1. ofs distintas com passagem em out', count(*) from pm;
select '2. dessas: situacao', case when x.id is null then 'OF nao encontrada' when x.deleted_at is not null or x.status ilike '%cancel%' then 'cancelada/excluida' when x.status ilike '%conclu%' and x.dr >= '2026-10-01' and x.dr < '2026-11-01' then 'concluida EM OUT (entra nas comissoes)' when x.status ilike '%conclu%' and x.dr < '2026-10-01' then 'concluida ANTES de out' when x.status ilike '%conclu%' then 'concluida DEPOIS de out' else 'ainda aberta: '||x.status end s, count(*), round(sum(coalesce(x.valor_total,0))::numeric,2) from pm left join public.ofs x on x.id::text = pm.of_id::text or (pm.of_id is null and x.of = pm.of_numero::text) left join o on o.id = x.id group by 2 order by 3 desc;
SQL
sql -At -F ' | ' -f /tmp/pm.sql 2>&1 | head -40
echo "## 3. concluidas em out SEM passagem em out"
sql -At -F ' | ' -c "select count(*), round(sum(coalesce(valor_total,0))::numeric,2) from public.ofs x where x.deleted_at is null and x.status ilike '%conclu%' and coalesce(x.data_conclusao::date, x.data_faturamento::date, x.created_at::date) between '2026-10-01' and '2026-10-31' and not exists (select 1 from public.passagens_maquina p where (p.of_id::text = x.id::text or p.of_numero::text = x.of) and p.data_passagem >= '2026-10-01' and p.data_passagem < '2026-11-01');"
echo "## 4. abertas com passagem em out: amostra (of, status, entrega, maquinas que passou, valor)"
sql -At -F ' | ' -c "select x.of, x.status, x.ent, (select string_agg(distinct p.maquina, ',') from public.passagens_maquina p where p.of_id::text = x.id::text), x.valor_total from public.ofs x where x.deleted_at is null and x.status not ilike '%conclu%' and x.status not ilike '%cancel%' and exists (select 1 from public.passagens_maquina p where p.of_id::text = x.id::text and p.data_passagem >= '2026-10-01' and p.data_passagem < '2026-11-01') order by x.valor_total desc nulls last limit 12;"
echo "## 5. concluidas antes de out com passagem em out: amostra"
sql -At -F ' | ' -c "select x.of, x.data_conclusao, (select max(p.data_passagem) from public.passagens_maquina p where p.of_id::text = x.id::text), x.valor_total from public.ofs x where x.status ilike '%conclu%' and x.data_conclusao < '2026-10-01' and exists (select 1 from public.passagens_maquina p where p.of_id::text = x.id::text and p.data_passagem >= '2026-10-01' and p.data_passagem < '2026-11-01') limit 10;"
echo "## 6. valor das passagens: soma por OF distinta usando valor_total da OF"
sql -At -F ' | ' -c "select count(distinct x.id), round(sum(x.valor_total)::numeric,2) from public.ofs x where x.id in (select of_id from public.passagens_maquina where data_passagem >= '2026-10-01' and data_passagem < '2026-11-01');"
rm -f /tmp/pm.sql
