@echo off
chcp 65001 > nul
cd /d "%~dp0"
node _probe_v2.cjs > PROBE_V0804.json 2> PROBE_V0804_err.txt
echo EXITCODE=%ERRORLEVEL% >> PROBE_V0804.json
