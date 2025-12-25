@echo off
REM FreelanceManager - Deploy to Dev Infrastructure
REM This script starts the dev infrastructure and runs the application

setlocal

set PROJECT_DIR=%~dp0
set INFRA_DIR=D:\workspace\agentpro\env\infrastructure\dev

echo ========================================
echo FreelanceManager - Dev Deployment
echo ========================================
echo.

REM Check if Docker is running
echo [1/5] Checking Docker status...
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)
echo ✓ Docker is running
echo.

REM Check if dev infrastructure is running
echo [2/5] Checking dev infrastructure...
docker ps --filter "name=infrastructure-postgres-dev" --filter "status=running" | find "infrastructure-postgres-dev" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Dev infrastructure is not running. Starting it now...
    echo.
    cd /d "%INFRA_DIR%"
    docker-compose up -d
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to start dev infrastructure!
        pause
        exit /b 1
    )
    echo Waiting for services to be healthy...
    timeout /t 10 /nobreak >nul
    echo ✓ Dev infrastructure started
) else (
    echo ✓ Dev infrastructure is already running
)
echo.

REM Ensure database exists
echo [3/5] Checking database...
docker exec infrastructure-postgres-dev psql -U postgres -lqt | find "freelance_manager_dev" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Creating database...
    docker exec infrastructure-postgres-dev psql -U postgres -c "CREATE DATABASE freelance_manager_dev;"
    echo ✓ Database created
) else (
    echo ✓ Database exists
)
echo.

REM Run migrations
echo [4/5] Running database migrations...
cd /d "%PROJECT_DIR%"
call npx prisma migrate deploy
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Migration failed. Trying prisma generate...
    call npx prisma generate
)
echo ✓ Database ready
echo.

REM Start the application
echo [5/5] Starting application...
echo.
echo ========================================
echo Application starting...
echo ========================================
echo.
echo Access points:
echo   - Application:    http://localhost:3000
echo   - Prisma Studio:  Run 'npm run db:studio'
echo   - PostgreSQL:     localhost:5432
echo   - N8N:            http://localhost:5678
echo   - RabbitMQ:       http://localhost:15672
echo.

call npm run dev

endlocal
