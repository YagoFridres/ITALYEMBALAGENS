. deploy/lib.sh
# Só leitura: localiza as OFs que o Yago pediu para cancelar (28/10)
L="'2745','315','316','317','318','420','432','433','434','462','463','464','465','466','523','524','525','1561','1700','473','1174','1356','1357','1417'"
sql -At -F ' | ' -c "select of, numero, of_num, status, coalesce(clinome,cliente_nome), left(coalesce(descricao,''),40), qtd, ent, deleted_at is not null, emp_id, created_at::date from public.ofs where of in ($L) or numero::text in ($L) or of_num::text in ($L) or ltrim(of,'0') in ($L) order by of::text;"
echo "## menores numeros existentes"; sql -At -c "select of from public.ofs order by nullif(regexp_replace(of,'\D','','g'),'')::int nulls last limit 15;" | tr '\n' ' '
