. deploy/lib.sh
# Sexta, 2ª linha da folha: São José do Cedro - Guarujá - Dionísio - Santo Antônio
sql -c "update roteiro_entrega set ordem = case cidade when 'São José do Cedro' then 6 when 'Guarujá do Sul' then 7 when 'Dionísio Cerqueira' then 8 when 'Santo Antônio do Sudoeste' then 9 else ordem end where dia_semana=5;"
sql -c "select dia_semana, ordem, cidade from roteiro_entrega order by 1,2;"
