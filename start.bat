@echo off
echo ========================================
echo   AudioFlow - Video Merger
echo ========================================
echo.
echo Starting development server...
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Start the development server
echo Opening http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.
start http://localhost:3000
npm run dev

pause
