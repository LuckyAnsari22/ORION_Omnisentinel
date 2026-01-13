@echo off
title Deploy All Services to Vercel

echo ========================================================
echo     DEPLOYING ALL 12 SERVICES TO VERCEL
echo ========================================================
echo.

echo [1/12] Deploying VisualKy...
cd visualky
call vercel --prod --yes
cd ..

echo.
echo [2/12] Deploying Guardian AI...
cd guardian-ai\frontend
call vercel --prod --yes
cd ..\..

echo.
echo [3/12] Deploying Phantom Guardian...
cd phantom-guardian
call vercel --prod --yes
cd ..

echo.
echo [4/12] Deploying BioSync Oracle...
cd biosync-oracle
call vercel --prod --yes
cd ..

echo.
echo [5/12] Deploying Reality Anchor...
cd reality-anchor
call vercel --prod --yes
cd ..

echo.
echo [6/12] Deploying Swarm Intelligence...
cd swarm-intelligence
call vercel --prod --yes
cd ..

echo.
echo [7/12] Deploying NeuroSync Guardian...
cd neurosync-guardian
call vercel --prod --yes
cd ..

echo.
echo [8/12] Deploying Danger Maps...
cd danger-maps
call vercel --prod --yes
cd ..

echo.
echo [9/12] Deploying Silent Witness...
cd silent-witness
call vercel --prod --yes
cd ..

echo.
echo [10/12] Deploying SonicGuard...
cd sonicguard
call vercel --prod --yes
cd ..

echo.
echo [11/12] Deploying EmotionGuard...
cd emotionguard
call vercel --prod --yes
cd ..

echo.
echo [12/12] Deploying Quantum Mesh...
cd quantum-mesh
call vercel --prod --yes
cd ..

echo.
echo ========================================================
echo     ALL SERVICES DEPLOYED!
echo ========================================================
echo.
echo Check your Vercel dashboard for all deployment URLs.
echo.
pause
