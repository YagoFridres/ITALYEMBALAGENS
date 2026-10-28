. deploy/lib.sh
# Coluna chapa_utilizada em orcamentos (antes só ficava dentro de parametros) + preenche os que já têm
sql -c "alter table public.orcamentos add column if not exists chapa_utilizada text;"
sql -c "update public.orcamentos set chapa_utilizada = coalesce(parametros->>'chapa_utilizada', parametros->>'chapaUtilizada') where chapa_utilizada is null and coalesce(parametros->>'chapa_utilizada', parametros->>'chapaUtilizada') is not null;"
sql -c "NOTIFY pgrst, 'reload schema';"
sql -At -c "select numero_orcamento, chapa_utilizada from public.orcamentos order by numero_orcamento;" | tr '\n' ' '
