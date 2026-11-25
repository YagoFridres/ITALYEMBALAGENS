#!/usr/bin/env bash
# 25/11: passagens_maquina — cria as colunas que o servidor envia (cada passagem falhava 5x antes de gravar)
source deploy/lib.sh
sql <<'SQL'
alter table passagens_maquina add column if not exists emp_id text;
alter table passagens_maquina add column if not exists empresa_id text;
alter table passagens_maquina add column if not exists empresa_nome text;
alter table passagens_maquina add column if not exists maquina_nome text;
alter table passagens_maquina add column if not exists produto_desc text;
select column_name, data_type from information_schema.columns where table_name='passagens_maquina' order by ordinal_position;
SQL
recarregar_api
