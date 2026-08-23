@echo off
chcp 65001 >nul
powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "%~dp0invoke-claude.ps1" %*
exit /b %ERRORLEVEL%
