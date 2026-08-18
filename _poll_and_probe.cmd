@echo off
cd /d "c:\Users\Usuario\PCP PROGRAMA\ITALYEMBALAGENS"
node _poll2.cjs > _poll2_stdout.txt 2>&1
echo POLL_EXIT=%ERRORLEVEL% >> _poll2_stdout.txt
