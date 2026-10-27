. deploy/lib.sh
sql -At -c "select count(*) from public.maquinas;"
sql -At -F ' | ' -c "select id, nome, ativa, ativo, ordem, setor, tipo, producao, caixas_hora, phora, setup_medio, tempo_setup_padrao_min, passagem_media, horario_inicio, horario_fim, almoco_min, created_at::date from public.maquinas order by nome, created_at;"
sql -At -c "select column_name from information_schema.columns where table_name='maquinas' order by ordinal_position;" | tr '\n' ' '
