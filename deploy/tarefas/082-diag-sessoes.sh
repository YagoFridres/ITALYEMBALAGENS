. deploy/lib.sh
sql <<'SQL'
\echo '== sessoes do modo operador =='
select status, count(*), count(quantidade) com_qtd, min(inicio)::date, max(inicio)::date from public.producao_sessoes group by 1;
\echo '== por maquina (finalizadas com qtd) =='
select maquina, count(*), round(avg(minutos)) med_min, round(sum(quantidade)::numeric/nullif(sum(minutos),0)*60) cxh from public.producao_sessoes where status='finalizada' and quantidade>0 group by 1 order by 2 desc;
\echo '== produtos com mais de uma sessao =='
select o.descricao, s.maquina, count(*) from public.producao_sessoes s join public.ofs o on o.id::text=s.of_id::text where s.status='finalizada' and s.quantidade>0 group by 1,2 having count(*)>1 order by 3 desc limit 15;
\echo '== OFs abertas com tempo_estimado_min fixo =='
select count(*) total, count(*) filter (where coalesce(tempo_estimado_min,0)>0) com_fixo from public.ofs where deleted_at is null and status not ilike '%conclu%' and status not ilike 'cancel%';
\echo '== maquinas =='
select nome, caixas_hora, producao, phora, setup_medio, tempo_setup_padrao_min from public.maquinas order by nome;
\echo '== tempos_reais =='
select count(*), count(velocidade_cxh) from public.tempos_reais;
SQL
