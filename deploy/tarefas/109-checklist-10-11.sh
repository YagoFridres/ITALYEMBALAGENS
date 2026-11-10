#!/bin/bash
# Checklist de Recebimento: 5 recebimentos de 10/11 da planilha controle_de_estoque_15 (sem duplicar)
source "$(dirname "$0")/../lib.sh"
sql <<'SQL'
insert into recebimento_insumos (data_recebimento, placa_veiculo, nota_fiscal, produto, fornecedor, quantidade, ordem_compra, responsavel, devolucao, cliente)
select v.* from (values
  ('2026-11-10'::date, 'TQD4H86', '895289', '470X1134 AB24',  'ADAMI', 3297, 'OC 1575', 'JESSICA', false, ''),
  ('2026-11-10'::date, NULL,      '2850',   '386X1080 CMM',   'ADF',   3749, 'OC 4',    'JESSICA', false, ''),
  ('2026-11-10'::date, NULL,      '2850',   '386X972 CMM',    'ADF',   6672, 'OC 4',    'JESSICA', false, ''),
  ('2026-11-10'::date, 'TQD4H86', '895289', '1055X2653 AB21', 'ADAMI', 262,  'OC 1581', 'JESSICA', false, ''),
  ('2026-11-10'::date, 'TQD4H86', '895289', '1325X2623 AB21', 'ADAMI', 209,  'OC 1581', 'JESSICA', false, '')
) as v(data_recebimento, placa_veiculo, nota_fiscal, produto, fornecedor, quantidade, ordem_compra, responsavel, devolucao, cliente)
where not exists (select 1 from recebimento_insumos r where r.data_recebimento = v.data_recebimento and r.nota_fiscal = v.nota_fiscal and r.produto = v.produto and r.quantidade = v.quantidade);
select to_char(data_recebimento,'YYYY-MM') mes, count(*) from recebimento_insumos group by 1 order by 1;
SQL
