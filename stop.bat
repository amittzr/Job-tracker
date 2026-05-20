@echo off
echo ========================================
echo    Job Tracker AI - Stopping All Services
echo ========================================
echo.

:: Kill Node processes (server, prisma studio, expo)
echo [1/2] Stopping Node processes...
taskkill /FI "WINDOWTITLE eq JOB-TRACKER-SERVER" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq JOB-TRACKER-PRISMA" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq JOB-TRACKER-CLIENT" /F >nul 2>&1
echo      Done.
echo.

:: Stop Docker
echo [2/2] Stopping Docker (PostgreSQL)...
docker-compose down
echo      Done.
echo.

echo ========================================
echo    All services stopped.
echo ========================================
pause
