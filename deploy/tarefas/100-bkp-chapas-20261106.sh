. deploy/lib.sh
# cópia de segurança do estoque de chapas antes de aplicar a planilha contole_de_estoque_10 (06/11/2026)
sql -c "create table if not exists public.chapas_estoque_v2_bkp_20261106 as select * from public.chapas_estoque_v2;"
sql -At -c "select 'cópia: '||count(*)||' chapas · '||coalesce(sum(coalesce(quantidade_atual,quantidade,0)),0)::bigint||' unidades' from public.chapas_estoque_v2_bkp_20261106;"
