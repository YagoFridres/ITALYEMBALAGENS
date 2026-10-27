. deploy/lib.sh
ID=aa621769-b325-46b7-ab0d-99bddb7b54d6
sql -c "insert into public.sync_ignorar(tabela,id,motivo) values ('ofs','$ID','OF de teste do Claude 27/10') on conflict do nothing;"
sql -c "delete from public.ofs where id='$ID';" || sql -c "update public.ofs set numero=null, of=null where id='$ID';"
sql -At -c "select id, numero, deleted_at from public.ofs where numero::text='4385' or of::text='4385';"
tail -8 /opt/pcp-pro/tarefas-log/sync-ofs.log
