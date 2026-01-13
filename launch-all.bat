@echo off
setlocal enabledelayedexpansion
title Arrayyy Launcher - ALL APPS

echo ========================================================
echo       LAUNCHING COMPLETE ORION SUITE
echo ========================================================
echo.

echo [1/2] Terminating existing Node/Python processes for clean slate...
taskkill /F /IM node.exe /T 2>nul
taskkill /F /IM python.exe /T 2>nul
timeout /t 2 >nul

echo.
echo [2/2] Launching Microservices...

:: 1. Guardian Backend (Flask)
echo - Starting Guardian Backend (5001)...
start "Guardian Backend" cmd /k "cd /d %~dp0guardian-ai && python app.py"

:: 2. Guardian Frontend
echo - Starting Guardian Frontend (5191)...
start "Guardian Frontend" /min cmd /k "cd /d %~dp0guardian-ai\frontend && npm run dev -- --port 5191"

:: 3. Phantom Guardian
echo - Starting Phantom Guardian (5178)...
start "Phantom Guardian" /min cmd /k "cd /d %~dp0phantom-guardian && npm run dev -- --port 5178"

:: 4. Visualky
echo - Starting VisualKy (5185)...
start "VisualKy" /min cmd /k "cd /d %~dp0visualky && npm run dev -- --port 5185"

:: 5. BioSync Oracle
echo - Starting BioSync Oracle (5179)...
start "BioSync Oracle" /min cmd /k "cd /d %~dp0biosync-oracle && npm run dev -- --port 5179"

:: 6. Reality Anchor
echo - Starting Reality Anchor (5181)...
start "Reality Anchor" /min cmd /k "cd /d %~dp0reality-anchor && npm run dev -- --port 5181"

:: 7. Swarm Intelligence
echo - Starting Swarm Intelligence (5180)...
start "Swarm Intelligence" /min cmd /k "cd /d %~dp0swarm-intelligence && npm run dev -- --port 5180"

:: 8. NeuroSync Guardian
echo - Starting NeuroSync Guardian (5184)...
start "NeuroSync Guadian" /min cmd /k "cd /d %~dp0neurosync-guardian && npm run dev -- --port 5184"

:: 9. Danger Maps
echo - Starting Danger Maps (5182)...
start "Danger Maps" /min cmd /k "cd /d %~dp0danger-maps && npm run dev -- --port 5182"

:: 10. Silent Witness
echo - Starting Silent Witness (5183)...
start "Silent Witness" /min cmd /k "cd /d %~dp0silent-witness && npm run dev -- --port 5183"

:: 11. SonicGuard
echo - Starting SonicGuard (5186)...
start "SonicGuard" /min cmd /k "cd /d %~dp0sonicguard && npm run dev -- --port 5186"

:: 12. EmotionGuard
echo - Starting EmotionGuard (5187)...
start "EmotionGuard" /min cmd /k "cd /d %~dp0emotionguard && npm run dev -- --port 5187"

:: 13. Quantum Mesh
echo - Starting Quantum Mesh (5177)...
start "Quantum Mesh" /min cmd /k "cd /d %~dp0quantum-mesh && npm run dev -- --port 5177"

echo.
echo Waiting for services to spin up...
timeout /t 10 >nul

:: 0. Main Platform (Orion)
echo - Starting MAIN PLATFORM (Orion) on Port 5174...
start "ORION PLATFORM" cmd /k "cd /d %~dp0frontend && npm run dev -- --port 5174"

:: Open Browser
echo.
echo Opening Main Platform...
timeout /t 5 >nul
start http://localhost:5174

echo.
echo ========================================================
echo       ALL 14 SYSTEMS RUNNING
echo ========================================================
echo.
pause
