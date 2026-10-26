. deploy/lib.sh
sql -c "update orcamentos set descricao=null where descricao ilike '%selecione o cliente%' returning numero_orcamento;"
