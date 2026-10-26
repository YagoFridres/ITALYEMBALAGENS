# Renomeia as OFs de teste do Claude para um nome visível (a lista esconde clientes com "TESTE")
. deploy/lib.sh
sql -c "update ofs set clinome='ZZ CLAUDE PROVA (APAGAR)', cliente_nome='ZZ CLAUDE PROVA (APAGAR)', \"cliNome\"='ZZ CLAUDE PROVA (APAGAR)' where cli_id='e0bce71d-d7e4-4408-9dee-f5755c31f8fc' and numero in ('4330','4331') returning numero, clinome, descricao;"
