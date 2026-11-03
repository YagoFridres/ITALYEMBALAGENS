. deploy/lib.sh
sql -c "select nome, caixas_hora, producao, phora, setup_medio, tempo_setup_padrao_min from public.maquinas order by nome;" || true
sql -c "select count(*), count(velocidade_cxh), count(of_id) from public.tempos_reais;" || true
sql -c "select column_name from information_schema.columns where table_schema='public' and table_name='producao_sessoes' order by ordinal_position;" || true
