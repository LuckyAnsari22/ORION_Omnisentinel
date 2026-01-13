@echo off
title AI Assistant Platform - ONE CLICK DEPLOY

echo ========================================================
echo     AI ASSISTANT PLATFORM - COMPLETE DEPLOYMENT
echo ========================================================
echo.
echo This will build and deploy ALL 13 Frontend Services.
echo.

REM Check if .env exists
if not exist .env (
    echo [!] .env file not found!
    echo.
    echo Run setup-env.bat first to configure your API keys.
    echo.
    choice /C YN /M "Do you want to create .env now"
    if errorlevel 2 goto :end
    call setup-env.bat
)

echo [1/3] Installing Root Dependencies...
call npm install

echo.
echo [2/3] Building All Services (This will take several minutes)...
echo.

echo - Building Main Frontend... (1/13)
cd frontend
call npm install
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Frontend build failed!
    cd ..
    goto :error
)
cd ..

echo - Building VisualKy... (2/13)
cd visualky
call npm install
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: VisualKy build failed!
    cd ..
    goto :error
)
cd ..

echo - Building Guardian AI... (3/13)
cd guardian-ai\frontend
call npm install
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Guardian AI build failed!
    cd ..\..
    goto :error
)
cd ..\..

echo - Building Phantom Guardian... (4/13)
cd phantom-guardian
call npm install
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Phantom Guardian build failed!
    cd ..
    goto :error
)
cd ..

echo - Building BioSync Oracle... (5/13)
cd biosync-oracle
call npm install
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: BioSync Oracle build failed!
    cd ..
    goto :error
)
cd ..

echo - Building Reality Anchor... (6/13)
cd reality-anchor
call npm install
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Reality Anchor build failed!
    cd ..
    goto :error
)
cd ..

echo - Building Swarm Intelligence... (7/13)
cd swarm-intelligence
call npm install
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Swarm Intelligence build failed!
    cd ..
    goto :error
)
cd ..

echo - Building NeuroSync Guardian... (8/13)
cd neurosync-guardian
call npm install
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: NeuroSync Guardian build failed!
    cd ..
    goto :error
)
cd ..

echo - Building Danger Maps... (9/13)
cd danger-maps
call npm install
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Danger Maps build failed!
    cd ..
    goto :error
)
cd ..

echo - Building Silent Witness... (10/13)
cd silent-witness
call npm install
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Silent Witness build failed!
    cd ..
    goto :error
)
cd ..

echo - Building SonicGuard... (11/13)
cd sonicguard
call npm install
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: SonicGuard build failed!
    cd ..
    goto :error
)
cd ..

echo - Building EmotionGuard... (12/13)
cd emotionguard
call npm install
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: EmotionGuard build failed!
    cd ..
    goto :error
)
cd ..

echo - Building Quantum Mesh... (13/13)
cd quantum-mesh
call npm install
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Quantum Mesh build failed!
    cd ..
    goto :error
)
cd ..

echo.
echo ========================================================
echo     ALL BUILDS SUCCESSFUL!
echo ========================================================
echo.
echo [3/3] Deploying to Vercel Production...
echo.
choice /C YN /M "Ready to push to Vercel Production"
if errorlevel 2 goto :end

call vercel --prod

echo.
echo ========================================================
echo     DEPLOYMENT COMPLETE!
echo ========================================================
echo.
echo Your platform is live!
echo Please verify all routes in the Vercel dashboard.
echo.
pause
exit /b 0

:error
echo.
echo ========================================================
echo     BUILD FAILED!
echo ========================================================
echo.
echo Please fix the error above and try again.
pause
exit /b 1

:end
echo.
echo Deployment cancelled.
pause
