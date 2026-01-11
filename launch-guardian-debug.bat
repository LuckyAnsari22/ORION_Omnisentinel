@echo off
title Guardian AI - Debug Launcher
echo Starting Guardian AI on Port 5001...
cd guardian-ai
python app.py
echo.
echo ===================================================
echo CRASH DETECTED. See error above.
echo ===================================================
pause
