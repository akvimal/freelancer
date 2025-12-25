@echo off
REM Reset database - WARNING: This will delete all data!

setlocal

echo ========================================
echo Database Reset - WARNING
echo ========================================
echo.
echo This will DELETE all data in the database!
echo Database: freelance_manager_dev
echo.
set /p CONFIRM="Are you sure you want to continue? (yes/no): "

if /i not "%CONFIRM%"=="yes" (
    echo Cancelled.
    exit /b 0
)

echo.
echo Dropping database...
docker exec infrastructure-postgres-dev psql -U postgres -c "DROP DATABASE IF EXISTS freelance_manager_dev;"

echo Creating database...
docker exec infrastructure-postgres-dev psql -U postgres -c "CREATE DATABASE freelance_manager_dev;"

echo Running migrations...
cd /d "%~dp0.."
call npx prisma migrate deploy

echo.
echo ========================================
echo Database reset complete!
echo ========================================

endlocal
