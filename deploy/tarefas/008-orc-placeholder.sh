# Orçamentos antigos salvos com o nome do placeholder como cliente → limpa o nome (só o texto falso)
. deploy/lib.sh
sql -c "update orcamentos set cliente_nome=null where cliente_nome ilike '%selecione o cliente%' returning numero_orcamento, nome;"
