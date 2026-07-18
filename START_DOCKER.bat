@echo off
TITLE KSP AI (NCIOS v2.5) — Docker Container Launcher
COLOR 0B
echo ===============================================================================
echo   [AI Emblem] KARNATAKA STATE POLICE — DOCKER DEPLOYMENT
echo ===============================================================================
echo   Building and starting the KSP AI container using Docker Compose...
echo ===============================================================================
echo.

docker-compose up --build -d

echo.
echo ===============================================================================
echo   Container 'ksp-ai-ncios' is starting in the background.
echo   Waiting 3 seconds for the server to initialize...
echo ===============================================================================
timeout /t 3 /nobreak >nul

start "" http://localhost:8000/

echo.
echo [INFO] The web portal has been opened in your default browser.
echo [INFO] To view live logs, run: docker logs -f ksp-ai-ncios
echo [INFO] To stop the container, run: docker-compose down
echo.
pause
