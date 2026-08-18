@echo off
cd /d "c:\Users\Usuario\PCP PROGRAMA\ITALYEMBALAGENS"
node _probe_fim.cjs > _probe_stdout.txt 2> _probe_stderr.txt
echo EXIT=%ERRORLEVEL% >> _probe_stdout.txt
