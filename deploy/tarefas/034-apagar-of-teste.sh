. deploy/lib.sh
ID=cd5ea34c-6446-468b-bb0b-844e31e028c0
sql -c "insert into public.sync_ignorar(tabela,id,motivo) values ('ofs','$ID','OF 4371 de teste apagada a pedido do Yago 27/10') on conflict do nothing;"
sql -c "delete from public.ofs where id='$ID';" || sql -c "update public.ofs set deleted_at=now(), numero=null where id='$ID';"
echo "== OFs criadas aqui depois da cópia (13:00 UTC)"
sql -At -c "select id, of, numero, created_at from public.ofs where created_at > '2026-10-27 13:05+00' order by created_at;"
