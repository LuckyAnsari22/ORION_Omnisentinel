@echo off
setlocal
title AI Assistant Platform - FIXED LAUNCH

echo ========================================================
echo       AI ASSISTANT PLATFORM - LAUNCH SEQUENCE
echo ========================================================
echo.

:: Kill any existing processes first
echo Cleaning up old processes...
taskkill /F /FI "WINDOWTITLE eq Guardian AI Backend*" 2>nul
taskkill /F /FI "WINDOWTITLE eq Guardian AI Frontend*" 2>nul
taskkill /F /FI "WINDOWTITLE eq Visualky System*" 2>nul
taskkill /F /FI "WINDOWTITLE eq AI Assistant Frontend*" 2>nul
timeout /t 2 >nul

echo.
echo [1/4] Launching Guardian AI Backend (Port 5001)...
start "Guardian AI Backend" cmd /k "cd /d %~dp0guardian-ai && python app.py"

echo Waiting for backend to start...
timeout /t 5 >nul

echo [2/4] Launching Guardian AI Frontend (Port 5175)...
start "Guardian AI Frontend" cmd /k "cd /d %~dp0guardian-ai\frontend && npm run dev"

echo [3/4] Launching Visualky (Visual Intelligence)...
start "Visualky System" cmd /k "cd /d %~dp0visualky && npm run dev"

echo [4/4] Launching 3D Orchestrator (Frontend)...
start "AI Assistant Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================================
echo       ALL SYSTEMS IGNITED
echo ========================================================
echo.
echo Waiting for services to initialize...
timeout /t 10 >nul

echo Opening Landing Page...
start http://localhost:5174

echo.
echo ========================================================
echo   PLATFORM RUNNING - Check the opened windows
echo ========================================================
echo.
echo Guardian AI Backend: Check the "Guardian AI Backend" window
echo Frontend: http://localhost:5174
echo.
echo Press any key to shutdown all systems...
pause >nul

echo.
echo Shutting down...
taskkill /F /FI "WINDOWTITLE eq Guardian AI Backend*"
taskkill /F /FI "WINDOWTITLE eq Guardian AI Frontend*"
taskkill /F /FI "WINDOWTITLE eq Visualky System*"
taskkill /F /FI "WINDOWTITLE eq AI Assistant Frontend*"

echo Done.
