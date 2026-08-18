@echo off
chcp 65001 > nul
cd /d "%~dp0"
node _poll_probe_v0806.cjs > PROBE_V0806_OUTPUT.json 2> PROBE_V0806_ERR.txt
echo EXITCODE=%ERRORLEVEL% >> PROBE_V0806_OUTPUT.json
