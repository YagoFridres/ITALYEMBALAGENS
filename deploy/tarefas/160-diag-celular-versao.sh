#!/usr/bin/env bash
# 19/11: diagnóstico — que versão do sistema os celulares estão carregando (sem IPs)
echo "== servidores web"; (ls /var/log/nginx /var/log/caddy 2>/dev/null; systemctl is-active nginx caddy apache2 2>/dev/null) | head
for f in /var/log/nginx/access.log /var/log/nginx/access.log.1; do
  [ -f "$f" ] || continue
  echo "== $f (celulares: versões do patch.js pedidas)"
  grep -E 'patch\.js' "$f" | grep -Ei 'android|iphone|mobile' | awk '{print $4}' | cut -c2-15 > /tmp/d1
  grep -E 'patch\.js' "$f" | grep -Ei 'android|iphone|mobile' | grep -oE 'patch\.js\?v=[0-9A-Za-z_]+' | sort | uniq -c | sort -k2 | tail -15
  echo "-- últimas 15 páginas abertas por celular (hora, caminho, navegador)"
  grep -Ei 'android|iphone|mobile' "$f" | grep -E '"GET / |"GET /\?|"GET /index' | awk -F'"' '{split($1,a," "); print a[4], $2, ($6 ~ /iPhone/?"iPhone":($6 ~ /Android/?"Android":"outro")), ($6 ~ /wv\)/?"app-webview":"") }' | tail -15
  echo "-- sw.js pedidos por celular"
  grep -Ei 'android|iphone|mobile' "$f" | grep -c 'sw\.js'
done
echo "== pm2 logs (últimas linhas com versão/SW)"; pm2 logs pcp-pro --lines 300 --nostream 2>/dev/null | grep -Ei 'sw|vers' | tail -10
echo fim
