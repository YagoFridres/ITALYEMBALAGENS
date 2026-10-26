. deploy/lib.sh
sql -At -c "select column_name||':'||data_type from information_schema.columns where table_schema='public' and table_name='ofs' and (column_name ilike '%papel%' or column_name in ('urgente','urg','sem_papel','prioridade','prioridade_ordem','ordem_maquina'));"
echo ==; sql -At -c "select numero, passagens_maquina::text from ofs where numero='4331';" | cut -c1-600
echo ==; sql -At -c "select acao, tabela, created_at::text, left(coalesce(dados_novos::text,''),300) from audit_log where registro_id=(select id::text from ofs where numero='4331') order by created_at;" 2>&1 | cut -c1-400
