@echo off
cd /d "c:\Users\Usuario\PCP PROGRAMA\ITALYEMBALAGENS"
echo PROVA URG1: grep padroes do fallback admin 1234 no server.js
echo ===========================================================
echo 1. MASTER_HASH / MASTER_EMAILS / masterOk / admin-master-fallback
findstr /I /N /C:"MASTER_HASH" /C:"MASTER_EMAILS" /C:"masterOk" /C:"admin-master-fallback" /C:"master-fallback" server.js
echo EXIT_1=%ERRORLEVEL%
echo ===========================================================
echo 2. hash bcrypt hardcoded 3NzN0GtSuoi53bvt8gfqUu
findstr /N /C:"3NzN0GtSuoi53bvt8gfqUu" server.js
echo EXIT_2=%ERRORLEVEL%
echo ===========================================================
echo 3. lista emails aceitos ['admin','admin@italy', 'master', 'root', 'adm@italy']
findstr /I /N /C:"'admin@italyembalagens" /C:"'admin@italy'" /C:"'master'" /C:"'adm@italy" server.js
echo EXIT_3=%ERRORLEVEL%
echo ===========================================================
echo 4. comentario ou codigo citando senha 1234 fallback
findstr /I /N /C:"senha.*1234" /C:"1234.*fallback" /C:"fallback.*1234" /C:"emergencia" server.js
echo EXIT_4=%ERRORLEVEL%
echo ===========================================================
echo 5. bloco antigo if !rows L1669 antigo (não deve existir master email list):
findstr /N /C:"if (!rows || rows.length === 0)" server.js
echo EXIT_5=%ERRORLEVEL%
