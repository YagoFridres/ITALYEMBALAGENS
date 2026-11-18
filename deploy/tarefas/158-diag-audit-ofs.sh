#!/usr/bin/env bash
# Diagnóstico (somente leitura): o audit_log guarda o "antes" das OFs concluídas? e quais status existem
source deploy/lib.sh
sql -c "select operacao, count(*) from audit_log where tabela='ofs' group by 1;"
sql -c "select count(*) as conclusoes_com_antes from audit_log where tabela='ofs' and operacao='UPDATE' and coalesce(dados_depois->>'status','') ilike 'conclu%' and coalesce(dados_antes->>'status','') not ilike 'conclu%';"
sql -c "select status, count(*) from ofs where deleted_at is null group by 1 order by 2 desc;"
sql -c "select tgname from pg_trigger where tgrelid='ofs'::regclass and not tgisinternal;"
sql -c "select count(*) filter (where tipo_caixa_id is not null) tipo, count(*) filter (where gramatura_id is not null) gram, count(*) total from ofs where status ilike 'conclu%';"
