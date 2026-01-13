@echo off
REM AI Assistant Platform - Windows Deployment Script

echo ========================================
echo AI Assistant Platform - Deployment
echo ========================================
echo.

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [!] Vercel CLI not found. Installing...
    call npm install -g vercel
)

echo [1/4] Deploying Main Frontend...
cd frontend
call vercel --prod --yes
cd ..
echo [OK] Main Frontend deployed
echo.

echo [2/4] Deploying Visualky...
cd visualky
call vercel --prod --yes
cd ..
echo [OK] Visualky deployed
echo.

echo [3/4] Deploying Guardian AI Frontend...
cd guardian-ai\frontend
call vercel --prod --yes
cd ..\..
echo [OK] Guardian AI Frontend deployed
echo.

echo ========================================
echo [SUCCESS] All components deployed!
echo ========================================
echo.
echo Next steps:
echo 1. Check Vercel dashboard for deployment URLs
echo 2. Deploy Guardian AI backend to Render/Railway
echo 3. Update API URLs in code
echo 4. See DEPLOYMENT_GUIDE.md for details
echo.
pause
