@echo off
setlocal
title AI Assistant Platform - Mission Control

echo ========================================================
echo       AI ASSISTANT PLATFORM - LAUNCH SEQUENCE
echo ========================================================
echo.

:: 1. Check Frontend Dependencies
if not exist "frontend\node_modules" (
    echo [frontend] Installing dependencies...
    cd frontend && call npm install && cd ..
)

:: 2. Check Visualky Dependencies
if not exist "visualky\node_modules" (
    echo [visualky] Installing dependencies...
    cd visualky && call npm install && cd ..
)

:: 3. Check Guardian Frontend Dependencies
if not exist "guardian-ai\frontend\node_modules" (
    echo [guardian-frontend] Installing dependencies...
    cd guardian-ai\frontend && call npm install && cd ..\..
)

echo.
echo [1/4] Launching Guardian AI Backend (Port 5001)...
start "Guardian AI Backend (Port 5001)" cmd /k "cd guardian-ai && title Guardian AI Backend && echo Starting Guardian Backend... && python app.py"

echo [2/4] Launching Guardian AI Frontend (Port 5175)...
start "Guardian AI Frontend (Port 5175)" cmd /k "cd guardian-ai\frontend && title Guardian AI Frontend && echo Starting Guardian Frontend... && npm run dev"

echo [3/4] Launching Visualky (Visual Intelligence)...
start "Visualky System (Port 5173)" cmd /k "cd visualky && title Visualky && echo Starting Visualky... && npm run dev"

echo [4/4] Launching 3D Orchestrator (Frontend)...
start "AI Assistant Frontend (Port 5174)" cmd /k "cd frontend && title AI Assistant Orchestrator && echo Launching 3D Interface... && npm run dev"

echo.
echo ========================================================
echo       ALL SYSTEMS IGNITED
echo ========================================================
echo.
echo Waiting for services to initialize...
timeout /t 5 >nul

echo Opening Landing Page...
start http://localhost:5174

echo.
echo [INFO] Press any key to shutdown all systems...
pause >nul

taskkill /FI "WINDOWTITLE eq Guardian AI System*" /F
taskkill /FI "WINDOWTITLE eq Visualky System*" /F
taskkill /FI "WINDOWTITLE eq AI Assistant Frontend*" /F
