. deploy/lib.sh
# Riscador só existia como "RISCADOR 01/02" (inativos): cria o cadastro "Riscador" com os dados do RISCADOR 01
sql -c "insert into public.maquinas (nome, ativa, ativo, ordem, setor, producao, caixas_hora, setup_medio, tempo_setup_padrao_min, passagem_media, horario_inicio, horario_fim, almoco_inicio, almoco_min, intervalo_manha_min, intervalo_tarde_min, setup_manha_min, setup_tarde_min)
 select 'Riscador', true, true, 6, 'CORTE', producao, caixas_hora, setup_medio, tempo_setup_padrao_min, passagem_media, horario_inicio, horario_fim, almoco_inicio, almoco_min, intervalo_manha_min, intervalo_tarde_min, setup_manha_min, setup_tarde_min
 from public.maquinas where nome='RISCADOR 01' and not exists (select 1 from public.maquinas where lower(nome)='riscador') limit 1;"
sql -At -c "select nome, ativa, caixas_hora, setup_medio from public.maquinas where lower(nome) like 'riscador%';"
