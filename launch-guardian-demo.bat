@echo off
title Guardian AI - DEMO MODE (No TensorFlow Required)

echo ========================================
echo   GUARDIAN AI - DEMO MODE
echo ========================================
echo.
echo This mode runs Guardian AI without TensorFlow
echo Perfect for presentations and demos!
echo.

cd guardian-ai
set DEMO_MODE=true
echo Starting Guardian AI Backend in DEMO MODE...
python app.py

pause
