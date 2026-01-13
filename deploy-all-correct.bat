@echo off
setlocal enabledelayedexpansion
title Deploy All Orion Services - Correct Method

echo ========================================================
echo     ORION PLATFORM - PROPER DEPLOYMENT
echo ========================================================
echo.
echo This will deploy each service as a separate Vercel project.
echo Each service will get its own URL.
echo.
pause

REM Store deployment URLs
set "URLS_FILE=DEPLOYED_URLS.txt"
echo ORION PLATFORM - DEPLOYED SERVICES > %URLS_FILE%
echo ======================================= >> %URLS_FILE%
echo. >> %URLS_FILE%

echo [1/13] Deploying Main Frontend (Orion)...
cd frontend
vercel --prod --yes > ..\deploy_temp.txt 2>&1
findstr /C:"https://" ..\deploy_temp.txt >> ..\%URLS_FILE%
cd ..
echo.

echo [2/13] Deploying VisualKy...
cd visualky
vercel --prod --yes > ..\deploy_temp.txt 2>&1
findstr /C:"https://" ..\deploy_temp.txt >> ..\%URLS_FILE%
cd ..
echo.

echo [3/13] Deploying Guardian AI...
cd guardian-ai\frontend
vercel --prod --yes > ..\..\deploy_temp.txt 2>&1
findstr /C:"https://" ..\..\deploy_temp.txt >> ..\..\%URLS_FILE%
cd ..\..
echo.

echo [4/13] Deploying Phantom Guardian...
cd phantom-guardian
vercel --prod --yes > ..\deploy_temp.txt 2>&1
findstr /C:"https://" ..\deploy_temp.txt >> ..\%URLS_FILE%
cd ..
echo.

echo [5/13] Deploying BioSync Oracle...
cd biosync-oracle
vercel --prod --yes > ..\deploy_temp.txt 2>&1
findstr /C:"https://" ..\deploy_temp.txt >> ..\%URLS_FILE%
cd ..
echo.

echo [6/13] Deploying Reality Anchor...
cd reality-anchor
vercel --prod --yes > ..\deploy_temp.txt 2>&1
findstr /C:"https://" ..\deploy_temp.txt >> ..\%URLS_FILE%
cd ..
echo.

echo [7/13] Deploying Swarm Intelligence...
cd swarm-intelligence
vercel --prod --yes > ..\deploy_temp.txt 2>&1
findstr /C:"https://" ..\deploy_temp.txt >> ..\%URLS_FILE%
cd ..
echo.

echo [8/13] Deploying NeuroSync Guardian...
cd neurosync-guardian
vercel --prod --yes > ..\deploy_temp.txt 2>&1
findstr /C:"https://" ..\deploy_temp.txt >> ..\%URLS_FILE%
cd ..
echo.

echo [9/13] Deploying Danger Maps...
cd danger-maps
vercel --prod --yes > ..\deploy_temp.txt 2>&1
findstr /C:"https://" ..\deploy_temp.txt >> ..\%URLS_FILE%
cd ..
echo.

echo [10/13] Deploying Silent Witness...
cd silent-witness
vercel --prod --yes > ..\deploy_temp.txt 2>&1
findstr /C:"https://" ..\deploy_temp.txt >> ..\%URLS_FILE%
cd ..
echo.

echo [11/13] Deploying SonicGuard...
cd sonicguard
vercel --prod --yes > ..\deploy_temp.txt 2>&1
findstr /C:"https://" ..\deploy_temp.txt >> ..\%URLS_FILE%
cd ..
echo.

echo [12/13] Deploying EmotionGuard...
cd emotionguard
vercel --prod --yes > ..\deploy_temp.txt 2>&1
findstr /C:"https://" ..\deploy_temp.txt >> ..\%URLS_FILE%
cd ..
echo.

echo [13/13] Deploying Quantum Mesh...
cd quantum-mesh
vercel --prod --yes > ..\deploy_temp.txt 2>&1
findstr /C:"https://" ..\deploy_temp.txt >> ..\%URLS_FILE%
cd ..
echo.

REM Cleanup
del deploy_temp.txt 2>nul

echo.
echo ========================================================
echo     ALL SERVICES DEPLOYED!
echo ========================================================
echo.
echo All deployment URLs have been saved to: %URLS_FILE%
echo.
type %URLS_FILE%
echo.
pause
