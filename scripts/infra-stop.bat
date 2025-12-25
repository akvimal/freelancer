@echo off
REM Stop dev infrastructure

setlocal

set INFRA_DIR=D:\workspace\agentpro\env\infrastructure\dev

echo ========================================
echo Stopping Dev Infrastructure
echo ========================================
echo.

cd /d "%INFRA_DIR%"
docker-compose stop

echo.
echo Infrastructure stopped.

endlocal
pause
