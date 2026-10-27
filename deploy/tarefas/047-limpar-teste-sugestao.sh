. deploy/lib.sh
# Remove a sugestão de teste do Claude (27/10 ~17:56)
sql -c "delete from public.papelao_solicitacoes where descricao ilike 'TESTE CLAUDE%';"
sql -At -c "select status, count(*) from public.papelao_solicitacoes group by 1;" | tr '\n' ' '
