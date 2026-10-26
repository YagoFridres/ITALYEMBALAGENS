. deploy/lib.sh
sql -x -c "select numero, status, urgente, urg, sem_papel, papel_comprado, previsao_entrega_papel, maq, fluxo_maquinas, maquina_atual_index, passou_maquina, passou_maquina_nome, passou_em, passagens_maquina, ordem_maquina, data_producao, dia_programacao, setor_finalizacao from ofs where numero='4331';"
sql -c "select * from passagens_maquina order by created_at desc nulls last limit 3;" 2>&1 | cut -c1-400
