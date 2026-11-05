. deploy/lib.sh
# Diagnóstico: OF que apareceu como salva e não gravou (05/11 ~09:40)
LOG=$(pm2 jlist 2>/dev/null | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const a=JSON.parse(s).find(p=>p.name==="pcp-pro");console.log(a.pm2_env.pm_out_log_path+" "+a.pm2_env.pm_err_log_path)}catch(e){}})')
echo "logs: $LOG"
for f in $LOG; do echo "== $f"; tail -n 4000 "$f" | grep -iE "ofs|OF RAPIDA|duplic|erro|error" | grep -E "T1[23]:|0?9:[0-9]{2}|12:[0-9]{2}" | grep -v "GET /api/ofs" | tail -n 80 | cut -c1-400; done
sql -c "select numero, cliente_nome, status, created_at, deleted_at from public.ofs where created_at > now() - interval '3 hours' or numero::text in ('4624','4625') order by created_at desc limit 20;" || true
sql -c "select numero, created_at from public.ofs where deleted_at is not null and updated_at > now() - interval '3 hours' limit 10;" || true
