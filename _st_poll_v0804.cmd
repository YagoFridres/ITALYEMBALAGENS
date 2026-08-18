@echo off
chcp 65001 > nul
node "%~dp0_poll_version_0804.cjs" > "%~dp0_poll_version_0804_out.txt" 2>&1
echo EXITCODE=%ERRORLEVEL%>> "%~dp0_poll_version_0804_out.txt"
