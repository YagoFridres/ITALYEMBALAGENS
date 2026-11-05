. deploy/lib.sh
# OF 4309 (MX DO BRASIL) foi sobrescrita às 15:31 de 05/11 por uma "OF nova" (bug do modo edição).
# Guarda o estado sobrescrito e devolve os campos do formulário ao backup das 06:25.
sql -c "drop table if exists _ofs_4309_sobrescrita; create table _ofs_4309_sobrescrita as select * from ofs where id='a8ceff29-f636-4ad3-9185-90edab2e1652';"
sql -c "update ofs o set ent=b.ent, maq=b.maq, qtd=b.qtd, itens=b.itens, total=b.total, vendid=b.vendid, descricao=b.descricao, qtd_pedida=b.qtd_pedida, quantidade=b.quantidade, valor_total=b.valor_total, valor_venda=b.valor_venda, data_entrega=b.data_entrega, fluxo_maquinas=b.fluxo_maquinas, cores_impressao=b.cores_impressao, maquina_agendada=b.maquina_agendada, updated_at=now() from _bkp_ofs_4309 b where o.id=b.id;"
sql -c "select numero, cliente_nome, descricao, qtd, data_entrega, maquina_agendada, valor_total from ofs where id='a8ceff29-f636-4ad3-9185-90edab2e1652';"
