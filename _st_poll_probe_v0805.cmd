@echo off
chcp 65001 > nul
cd /d "%~dp0"
node _poll_probe_v0805.cjs > PROBE_V0805_OUTPUT.json 2> PROBE_V0805_ERR.txt
echo EXITCODE=%ERRORLEVEL% >> PROBE_V0805_OUTPUT.json
