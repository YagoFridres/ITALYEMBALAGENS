@echo off
cd /d "c:\Users\Usuario\PCP PROGRAMA\ITALYEMBALAGENS"
node _poll3.cjs > _poll3_stdout.txt 2>&1
echo P3EXIT=%ERRORLEVEL% >> _poll3_stdout.txt
