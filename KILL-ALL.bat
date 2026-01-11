@echo off
echo Killing all platform processes...
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM python.exe /T >nul 2>&1
echo Done. All systems offline.
