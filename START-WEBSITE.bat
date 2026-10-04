@echo off
echo ========================================
echo    CAR COLLECTORS - QUICK START
echo ========================================
echo.
echo Step 1: Starting Backend Server...
start "Backend" "%~dp01-START-BACKEND.bat"
echo Waiting for backend to start...
timeout /t 5 /nobreak > nul
echo.
echo Step 2: Starting Frontend Server...
start "Frontend" "%~dp02-START-FRONTEND.bat"
echo.
echo ========================================
echo Website will open in your browser
echo.
echo To stop: Close both windows
echo ========================================
echo.
pause
