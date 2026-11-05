. deploy/lib.sh
# A mesma cidade pode estar em vários dias (ex.: Flor do Sertão seg/ter/qui): único passa a ser cidade+dia.
sql -c "drop index if exists roteiro_cidade_uidx; create unique index if not exists roteiro_cidade_dia_uidx on roteiro_entrega (lower(cidade), dia_semana);"
sql -c "drop table if exists _roteiro_entrega_ant; create table _roteiro_entrega_ant as select * from roteiro_entrega;"
sql <<'SQL'
begin;
delete from roteiro_entrega;
insert into roteiro_entrega (cidade, dia_semana, ordem, ativo) values
 ('Flor do Sertão',1,1,true),('Iraceminha',1,2,true),('Maravilha',1,3,true),('Tigrinhos',1,4,true),('Pinhalzinho',1,5,true),('Saudades',1,6,true),('São Carlos',1,7,true),('Palmitos',1,8,true),
 ('Flor do Sertão',2,1,true),('Iraceminha',2,2,true),('Maravilha',2,3,true),('Cunha Porã',2,4,true),
 ('Caibi',3,1,true),('Riqueza',3,2,true),('Mondaí',3,3,true),('Iporã do Oeste',3,4,true),('São João do Oeste',3,5,true),('Itapiranga',3,6,true),
 ('Flor do Sertão',4,1,true),('Iraceminha',4,2,true),('Maravilha',4,3,true),('Pinhalzinho',4,4,true),('Nova Erechim',4,5,true),('Nova Itaberaba',4,6,true),('Chapecó',4,7,true),('São Carlos',4,8,true),('Palmitos',4,9,true),('Cunha Porã',4,10,true),
 ('São Miguel do Oeste',5,1,true),('Paraíso',5,2,true),('Guaraciaba',5,3,true),('Anchieta',5,4,true),('Palma Sola',5,5,true),('São José do Cedro',5,6,true),('Guarujá do Sul',5,7,true),('Dionísio Cerqueira',5,8,true),('Santo Antônio do Sudoeste',5,9,true);
commit;
SQL
sql -c "select dia_semana, ordem, cidade from roteiro_entrega order by 1,2;"
