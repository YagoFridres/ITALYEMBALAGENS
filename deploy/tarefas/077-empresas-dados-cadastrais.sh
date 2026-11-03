. deploy/lib.sh
# campos para os dados reais das empresas (impressões de compra etc.)
sql <<'SQL'
alter table public.empresas add column if not exists razao_social text;
alter table public.empresas add column if not exists endereco text;
alter table public.empresas add column if not exists cep text;
alter table public.empresas add column if not exists telefone text;
alter table public.empresas add column if not exists email text;
select codigo, nome, razao_social, cnpj, endereco, cep, cidade, uf, telefone from public.empresas order by codigo;
SQL
recarregar_api
