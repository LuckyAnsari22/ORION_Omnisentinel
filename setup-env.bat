@echo off
echo ========================================
echo AI Assistant Platform - Environment Setup
echo ========================================
echo.

REM Check if .env exists
if exist .env (
    echo .env file already exists!
    echo.
    choice /C YN /M "Do you want to overwrite it"
    if errorlevel 2 goto :end
)

echo Creating .env file...
copy .env.example .env

echo.
echo ========================================
echo .env file created successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Open .env file in your editor
echo 2. Add your API keys:
echo    - VITE_GEMINI_API_KEY
echo    - VITE_GROQ_API_KEY  
echo    - VITE_REPLICATE_API_KEY
echo 3. Save the file
echo 4. Run: vercel --prod
echo.
echo Opening .env file now...
notepad .env

:end
pause
