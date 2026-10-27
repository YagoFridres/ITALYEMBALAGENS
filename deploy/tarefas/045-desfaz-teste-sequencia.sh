. deploy/lib.sh
# Desfaz a ordem de teste da IMP 02 feita pelo Claude (27/10 ~17:45)
sql -At -c "select maquina, count(*), max(updated_at) from public.sequenciamento_manual group by 1;"
sql -c "delete from public.sequenciamento_manual where maquina='IMP 02' and updated_at > '2026-10-27 20:40+00';"
