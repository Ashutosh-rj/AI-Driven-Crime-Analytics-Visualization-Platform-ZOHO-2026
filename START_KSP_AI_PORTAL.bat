@echo off
TITLE KSP AI (NCIOS v2.5) — Enterprise Full-Stack Launcher
COLOR 0B
echo ===============================================================================
echo   [AI Emblem] KARNATAKA STATE POLICE — CRIME INTELLIGENCE & OPERATIONS SYSTEM
echo ===============================================================================
echo   Initializing Enterprise FastAPI Backend (Port 8000)...
echo   Initializing React + Vite Frontend (Port 5173)...
echo ===============================================================================
echo.

:: Detect Python Launcher
set PY_CMD=python
py -V:Astral/CPython3.11.15 --version >nul 2>&1
if %errorlevel% equ 0 set PY_CMD=py -V:Astral/CPython3.11.15
py -3.11 --version >nul 2>&1
if %errorlevel% equ 0 set PY_CMD=py -3.11

echo [INFO] Starting FastAPI Backend on Port 8000...
start "FastAPI Backend" cmd /c "%PY_CMD% src\backend\main.py"

echo [INFO] Starting Vite React Frontend on Port 5173...
cd src\frontend
start "Vite React Frontend" cmd /c "npm install && npm run dev"

echo.
echo ===============================================================================
echo   The backend is starting. The React frontend is starting in a new window.
echo   Waiting 5 seconds to open the browser...
echo ===============================================================================
timeout /t 5 /nobreak >nul

start "" http://localhost:5173/

echo.
echo [INFO] The enterprise web portal has been opened in your default browser.
pause
