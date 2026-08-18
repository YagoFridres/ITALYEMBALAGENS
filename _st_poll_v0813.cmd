@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo START %date% %time%
node _poll_deploy_v0813.cjs > _POLL_V0813_stdout.txt 2> _POLL_V0813_stderr.txt
echo EXITCODE=%errorlevel%
echo DONE %date% %time%
