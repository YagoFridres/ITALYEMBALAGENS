#!/usr/bin/env bash
# Diagnóstico (somente leitura): quem atualizou as chapas WKB no backup de 07/11
source deploy/lib.sh
f=/opt/pcp-pro/backups/banco_2026-11-07_0625.dump
$DC exec -T db pg_restore -a -t chapas_estoque_v2 -f - < "$f" 2>/dev/null | grep -E "WKB.*(466X917|730X820|630X780|520X640)" | grep -o "Planilha[^	]*\|ESTOQUE[^	]*\|ADIMIN[^	]*\|sistema" | sort | uniq -c
$DC exec -T db pg_restore -a -t chapas_estoque_v2 -f - < "$f" 2>/dev/null | grep -c "Planilha"
