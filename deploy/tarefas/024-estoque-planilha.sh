. deploy/lib.sh
# Estoque de chapas do TESTE = planilha do Yago (26/10/2026). Backup em chapas_estoque_v2_bkp_20261026.
sql < deploy/estoque-planilha-20261026.sql
# chapas que não estão na planilha: apaga; se alguma tiver vínculo e não puder ser apagada, fica zerada
sql -c "delete from public.chapas_estoque_v2 where coalesce(atualizado_por,'') <> 'Planilha 26/10/2026' and coalesce(criado_por,'') <> 'Planilha 26/10/2026';" || \
sql -c "update public.chapas_estoque_v2 set quantidade=0, quantidade_atual=0, valor_total=0, updated_at=now() where coalesce(atualizado_por,'') <> 'Planilha 26/10/2026' and coalesce(criado_por,'') <> 'Planilha 26/10/2026';"
recarregar_api
sql -At -c "select count(*)||' chapas · '||sum(coalesce(quantidade_atual,quantidade,0))::bigint||' unidades · R\$ '||round(sum(coalesce(valor_total,0)),2) from public.chapas_estoque_v2;"
sql -At -c "select count(*) from public.chapas_estoque_v2_bkp_20261026;"
