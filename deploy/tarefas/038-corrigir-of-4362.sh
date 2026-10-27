. deploy/lib.sh
# Pedido do Yago 27/10: OF 4362 (Ripke) — tamanho 73x1145, quantidade 200, valor unitário 0,46
ID=78769806-c7d5-48d9-9f6d-c027e1ef2ab0
sql -At -c "select column_name||':'||data_type from information_schema.columns where table_name='ofs' and column_name in ('qtd','quantidade','qtd_pedida','vunit','valor_unitario','preco','valor_total','valor_venda','total','itens','caixa_largura','caixa_comprimento');" | tr '\n' ' '; echo
sql <<SQL
do \$\$
declare c text;
begin
  for c in select column_name from information_schema.columns where table_name='ofs' and column_name in ('qtd','quantidade','qtd_pedida') loop
    execute format('update public.ofs set %I = 200 where id = %L', c, '$ID');
  end loop;
  for c in select column_name from information_schema.columns where table_name='ofs' and column_name in ('vunit','valor_unitario','preco') loop
    execute format('update public.ofs set %I = 0.46 where id = %L', c, '$ID');
  end loop;
  for c in select column_name from information_schema.columns where table_name='ofs' and column_name in ('valor_total','valor_venda','total') loop
    execute format('update public.ofs set %I = 92 where id = %L', c, '$ID');
  end loop;
end \$\$;
update public.ofs set caixa_largura=73, caixa_comprimento=1145,
  itens = (select jsonb_agg(e || '{"qtd":200,"quantidade":200,"vunit":0.46,"valor_unitario":0.46,"valor_total":92}'::jsonb) from jsonb_array_elements(itens::jsonb) e)
  where id='$ID';
SQL
sql -At -c "select numero, quantidade, valor_total, caixa_largura, caixa_comprimento, itens::text from public.ofs where id='$ID';" | cut -c1-400
