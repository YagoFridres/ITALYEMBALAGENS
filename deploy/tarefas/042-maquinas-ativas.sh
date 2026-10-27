. deploy/lib.sh
# Acabamento, Coladeira e Corte Plana aparecem no modal de conclusão: deixam de ficar marcadas como inativas
sql -c "update public.maquinas set ativa=true where upper(nome) in ('ACABAMENTO','COLADEIRA','CORTE PLANA');"
sql -At -F ' | ' -c "select nome, ativa from public.maquinas order by nome;"
