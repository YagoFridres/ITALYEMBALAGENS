. deploy/lib.sh
# A cópia completa das 10:5x apagou o que só existia aqui. Devolve do backup feito logo antes dela.
D=$(ls -t /opt/pcp-pro/backups/antes-sync-*.dump | head -1); echo "backup: $D"
for t in almox_ordens papelao_solicitacoes sequenciamento_manual producao_sessoes; do
  ATUAL=$(sql -At -c "select count(*) from public.$t;" 2>/dev/null || echo erro)
  NOBKP=$(docker run --rm -i postgres:17 pg_restore -f - --data-only -t $t < "$D" 2>/dev/null | grep -c . )
  echo "$t: agora=$ATUAL linhas_no_backup~$NOBKP"
  if [ "$ATUAL" = "0" ]; then
    docker run --rm -i postgres:17 pg_restore -f - --data-only -t $t < "$D" 2>/dev/null | sql -q 2>&1 | tail -2
    echo "  depois=$(sql -At -c "select count(*) from public.$t;")"
  fi
done
