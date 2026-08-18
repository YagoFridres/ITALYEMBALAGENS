@echo off
chcp 65001 > nul
cd /d "%~dp0"
node _probe_final_v0808.cjs > PROBE_V0808_stdout.txt 2> PROBE_V0808_stderr.txt
echo EXITCODE=%ERRORLEVEL% >> PROBE_V0808_stdout.txt
