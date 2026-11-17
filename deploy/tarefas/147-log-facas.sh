#!/bin/bash
# Diagnóstico (somente leitura): avisos do servidor ao salvar faca — 17/11
sleep 60
grep -h "facas PUT\|facas POST" /root/.pm2/logs/pcp-pro-*.log 2>/dev/null | tail -12 | cut -c1-400
