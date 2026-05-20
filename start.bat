@echo off
echo ========================================
echo    Job Tracker AI - Starting All Services
echo ========================================
echo.

:: Start Docker (PostgreSQL)
echo [1/4] Starting Docker (PostgreSQL)...
docker-compose up -d
echo      Done.
echo.

:: Wait for DB to be ready
echo [2/4] Waiting for database...
timeout /t 3 /nobreak >nul
echo      Done.
echo.

:: Start Server
echo [3/4] Starting Server...
cd server
start "JOB-TRACKER-SERVER" cmd /k "npx prisma generate && npx prisma migrate deploy && npm run dev"
cd ..
echo      Server starting on http://localhost:3000
echo.

:: Wait for server to boot
timeout /t 4 /nobreak >nul

:: Start Prisma Studio
echo [4/4] Starting Prisma Studio...
cd server
start "JOB-TRACKER-PRISMA" cmd /k "npx prisma studio"
cd ..
echo      Prisma Studio on http://localhost:5555
echo.

:: Start Client
echo [5/5] Starting Client (Expo)...
cd client
start "JOB-TRACKER-CLIENT" cmd /k "npx expo start"
cd ..
echo      Client starting...
echo.

echo ========================================
echo    All services started!
echo    Server:  http://localhost:3000
echo    Studio:  http://localhost:5555
echo    Client:  Press 'w' in client terminal for web
echo ========================================
echo.
echo To stop all services, run: stop.bat
pause
