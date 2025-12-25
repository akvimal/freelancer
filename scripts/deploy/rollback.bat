@echo off
REM FreelanceManager - Rollback to Previous Version
REM Usage: rollback.bat [version]

setlocal

set PROJECT_DIR=%~dp0..\..
set VERSION=%1

if "%VERSION%"=="" (
    echo [ERROR] Version is required!
    echo Usage: rollback.bat [version]
    echo Example: rollback.bat v1.0.0
    echo.
    echo Available versions:
    docker images freelance-manager --format "{{.Tag}}"
    pause
    exit /b 1
)

echo ========================================
echo FreelanceManager - Rollback
echo Rolling back to version: %VERSION%
echo ========================================
echo.

REM Check if version exists
docker images freelance-manager:%VERSION% --format "{{.Tag}}" | find "%VERSION%" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Version %VERSION% not found!
    echo.
    echo Available versions:
    docker images freelance-manager --format "{{.Tag}}"
    pause
    exit /b 1
)

echo Stopping current version...
cd /d "%PROJECT_DIR%"
docker-compose -f docker-compose.prod.yml down

echo Starting version %VERSION%...
set VERSION=%VERSION%
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

echo.
echo Waiting for application to start...
timeout /t 15 /nobreak >nul

echo Running health check...
curl -s http://localhost:3001/api/health >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Health check failed!
    echo Check logs: docker logs freelance-manager-prod
) else (
    echo ✓ Rollback successful!
)

echo.
echo ========================================
echo Rollback Complete!
echo ========================================

endlocal
pause
