#!/usr/bin/env bash
# 23/11: quais salvamentos de OF foram reaproveitados pela proteção anti-duplicata (para achar itens adicionais que não foram criados)
F=$(find / -xdev -name clientes-diag.ndjson -path "*/.dbg/*" 2>/dev/null | head -1)
echo "arquivo: $F"
grep -h '"ofr-salvar"' "$F" "$F.1" 2>/dev/null | grep -E '"replay"|"bloqueado"|"aviso-dup"' | sed -E 's/"st":"[^"]*"//' | cut -c1-260
echo fim
