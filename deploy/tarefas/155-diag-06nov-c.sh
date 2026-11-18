#!/usr/bin/env bash
# Diagnóstico (somente leitura): audit_log em 06/11 perto das 11:20
source deploy/lib.sh
sql -c "select string_agg(column_name, ',' order by ordinal_position) from information_schema.columns where table_name='audit_log';"
sql -c "select * from audit_log where created_at between '2026-11-06 14:15:00+00' and '2026-11-06 14:25:00+00' order by created_at limit 40;" 2>&1 | cut -c1-300 | head -60
