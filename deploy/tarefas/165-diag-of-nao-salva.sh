#!/usr/bin/env bash
# 23/11: diagnóstico — OF que a usuária diz não ter salvo (linhas de criação/edição de OF no log, sem dados pessoais)
source deploy/lib.sh
echo "== log (out) linhas de OF"
pm2 logs pcp-pro --out --lines 6000 --nostream 2>/dev/null | grep -E "OF SAVE|POST OFS|OFS FRONT|ofs-post|/api/ofs|OF-GUARDA|anti-duplicata|duplicad|PATCH OFS|PUT OFS|edicao" | sed -E 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+/<email>/g' | cut -c1-220 | tail -80
echo "== log (err) linhas de OF"
pm2 logs pcp-pro --err --lines 6000 --nostream 2>/dev/null | grep -iE "ofs|OF " | sed -E 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+/<email>/g' | cut -c1-220 | tail -40
echo "== OFs criadas/alteradas hoje desde 18:00 UTC"
sql -c "select numero, to_char(created_at at time zone 'America/Sao_Paulo','HH24:MI:SS') cria, to_char(updated_at at time zone 'America/Sao_Paulo','HH24:MI:SS') alt, left(descricao,30) descr, qtd, status, deleted_at is not null as excl from ofs where created_at >= '2026-11-23 18:00+00' or updated_at >= '2026-11-23 18:45+00' order by greatest(created_at,updated_at) desc limit 40;"
echo "== historico_acoes recentes de OF"
sql -c "select to_char(created_at at time zone 'America/Sao_Paulo','HH24:MI:SS') h, acao, left(coalesce(descricao,''),90) d from historico_acoes where created_at >= '2026-11-23 18:45+00' order by created_at desc limit 40;" || true
