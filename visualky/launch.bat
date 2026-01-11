@echo off
REM LocalLens Quick Start Launcher
REM Opens the application in your default browser

echo.
echo ==========================================
echo     LocalLens - Quick Start Launcher
echo ==========================================
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: npm is not installed
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if dev server is already running
netstat -ano | findstr :5173 >nul
if %ERRORLEVEL% equ 0 (
    echo [✓] Dev server already running on port 5173
    timeout /t 2 /nobreak
) else (
    echo [•] Starting dev server...
    start "" http://localhost:5173/
    timeout /t 3 /nobreak
)

REM Open browser
echo [✓] Opening LocalLens in your browser...
echo.
echo Application URL: http://localhost:5173/
echo.
echo If the page doesn't open automatically:
echo   1. Copy: http://localhost:5173/
echo   2. Paste in your browser address bar
echo   3. Press Enter
echo.
echo Press any key to continue...
pause >nul

REM Keep terminal open
timeout /t 999999

