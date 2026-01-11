@echo off
echo Restarting Guardian AI Backend with AI fix...
cd guardian-ai

echo Killing old Python processes...
taskkill /F /IM python.exe 2>nul

echo.
echo Starting Guardian AI Backend...
python app.py

pause
