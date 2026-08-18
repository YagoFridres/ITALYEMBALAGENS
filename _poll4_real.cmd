@echo off
cd /d "c:\Users\Usuario\PCP PROGRAMA\ITALYEMBALAGENS"
node _poll4.cjs > _poll4_stdout.txt 2>&1
echo P4EXIT=%ERRORLEVEL% >> _poll4_stdout.txt
