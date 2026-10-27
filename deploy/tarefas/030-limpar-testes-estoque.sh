. deploy/lib.sh
# Desfaz o teste de entrada/saída feito pelo Claude em 27/10 (chapa ADAMI AB21 2170X1350)
sql <<'SQL'
update public.chapas_estoque_v2 set nf='888929', numero_nf='888929', valor_unitario=7.0929, valor_total=round(7.0929*quantidade,2), pinned_compra=false
 where id='bd67d53a-1de5-4eab-b966-e09ba1d3f679';
delete from public.chapas_estoque_movimentos_v2 where nf='TESTE-CLAUDE' and chapa_id='bd67d53a-1de5-4eab-b966-e09ba1d3f679';
delete from public.papelao_solicitacoes where observacao ilike '%TESTE CLAUDE%';
SQL
sql -At -c "select nf, valor_unitario, quantidade, valor_total from public.chapas_estoque_v2 where id='bd67d53a-1de5-4eab-b966-e09ba1d3f679';"
sql -At -c "select count(*) from public.chapas_estoque_movimentos_v2 where nf='TESTE-CLAUDE';"
sql -At -c "select column_name from information_schema.columns where table_name='papelao_solicitacoes';" | tr '\n' ' '
sql -At -c "select id, numero, cliente, clinome, status from public.ofs where numero::text='4331' or of::text='4331';"
