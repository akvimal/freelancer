@echo off
REM Start dev infrastructure only

setlocal

set INFRA_DIR=D:\workspace\agentpro\env\infrastructure\dev

echo ========================================
echo Starting Dev Infrastructure
echo ========================================
echo.

cd /d "%INFRA_DIR%"
docker-compose up -d

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Infrastructure started successfully!
    echo ========================================
    echo.
    echo Services:
    docker-compose ps
    echo.
    echo Access points:
    echo   - PostgreSQL:     localhost:5432
    echo   - Redis:          localhost:6379
    echo   - N8N:            http://localhost:5678
    echo   - RabbitMQ UI:    http://localhost:15672
    echo   - Nginx:          http://localhost
) else (
    echo [ERROR] Failed to start infrastructure!
)

endlocal
pause
