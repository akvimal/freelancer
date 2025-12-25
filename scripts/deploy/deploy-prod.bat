@echo off
REM FreelanceManager - Production Deployment Script
REM Usage: deploy-prod.bat [version]

setlocal

set PROJECT_DIR=%~dp0..\..
set INFRA_DIR=D:\workspace\agentpro\env\infrastructure\prod
set VERSION=%1

if "%VERSION%"=="" (
    echo [ERROR] Version is required!
    echo Usage: deploy-prod.bat [version]
    echo Example: deploy-prod.bat v1.0.0
    pause
    exit /b 1
)

echo ========================================
echo FreelanceManager - Production Deployment
echo Version: %VERSION%
echo ========================================
echo.

REM Step 1: Pre-deployment checks
echo [1/8] Running pre-deployment checks...
echo.

REM Check Docker
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker is not running!
    pause
    exit /b 1
)
echo ✓ Docker is running

REM Check if .env.prod exists
if not exist "%PROJECT_DIR%\.env.prod" (
    echo [ERROR] .env.prod file not found!
    echo Please create .env.prod from .env.prod.example
    pause
    exit /b 1
)
echo ✓ .env.prod exists
echo.

REM Step 2: Check infrastructure
echo [2/8] Checking production infrastructure...
docker ps --filter "name=infrastructure-postgres-prod" --filter "status=running" | find "infrastructure-postgres-prod" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Production infrastructure is not running!
    echo Starting infrastructure...
    cd /d "%INFRA_DIR%"
    docker-compose up -d
    timeout /t 15 /nobreak >nul
    echo ✓ Infrastructure started
) else (
    echo ✓ Infrastructure is running
)
echo.

REM Step 3: Ensure database exists
echo [3/8] Checking database...
docker exec infrastructure-postgres-prod psql -U postgres -lqt | find "freelance_manager_prod" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Creating production database...
    docker exec infrastructure-postgres-prod psql -U postgres -c "CREATE DATABASE freelance_manager_prod;"
    echo ✓ Database created
) else (
    echo ✓ Database exists
)
echo.

REM Step 4: Pull latest code
echo [4/8] Pulling latest code from GitHub...
cd /d "%PROJECT_DIR%"
git fetch origin
git checkout main
git pull origin main
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to pull latest code!
    pause
    exit /b 1
)
echo ✓ Code updated
echo.

REM Step 5: Build Docker image
echo [5/8] Building Docker image (this may take a few minutes)...
set VERSION=%VERSION%
docker-compose -f docker-compose.prod.yml build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker build failed!
    pause
    exit /b 1
)
echo ✓ Image built successfully
echo.

REM Step 6: Tag image with version
echo [6/8] Tagging image...
docker tag freelance-manager:latest freelance-manager:%VERSION%
echo ✓ Image tagged as %VERSION%
echo.

REM Step 7: Deploy (stop old, start new)
echo [7/8] Deploying application...
echo Stopping old version...
docker-compose -f docker-compose.prod.yml down

echo Starting new version...
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Deployment failed!
    echo Rolling back...
    docker-compose -f docker-compose.prod.yml down
    pause
    exit /b 1
)
echo ✓ Application deployed
echo.

REM Step 8: Health check
echo [8/8] Running health check...
timeout /t 15 /nobreak >nul
curl -s http://localhost:3001/api/health >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Health check failed! Application may still be starting...
    echo Check logs: docker logs freelance-manager-prod
) else (
    echo ✓ Health check passed
)
echo.

echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Version deployed: %VERSION%
echo Application URL: http://localhost:3001
echo.
echo Useful commands:
echo   docker logs -f freelance-manager-prod    # View logs
echo   docker ps --filter name=freelance        # Check status
echo   scripts\deploy\rollback.bat %VERSION%    # Rollback if needed
echo.

endlocal
pause
