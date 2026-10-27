. deploy/lib.sh
# OCRE tinha sido salvo 3 vezes (a lista não atualizava): fica um só. Adiciona Bordô.
sql -c "delete from public.cores_impressao where upper(nome)='OCRE' and id <> (select id from public.cores_impressao where upper(nome)='OCRE' order by (hex is null), created_at limit 1);"
sql -c "update public.cores_impressao set nome='Ocre', hex=coalesce(hex,'#CC7722') where upper(nome)='OCRE';"
sql -c "insert into public.cores_impressao (empresa_id, nome, hex, ativo) select 'df5f7672-0a6b-402d-ae65-296554236c31', 'Bordô', '#800020', true where not exists (select 1 from public.cores_impressao where upper(nome) in ('BORDÔ','BORDO'));"
sql -At -c "select nome, hex from public.cores_impressao order by nome;" | tr '\n' ' '
