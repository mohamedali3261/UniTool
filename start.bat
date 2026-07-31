@echo off
echo ========================================
echo   UniTool - Media Processing Suite
echo ========================================
echo.
echo Starting development servers...
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Start watermark API server in background
echo Starting Watermark API on port 3001...
start "Watermark API" /MIN cmd /c "node server.js"

REM Start the development server
echo Opening http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.
start http://localhost:3000
npm run dev

pause
