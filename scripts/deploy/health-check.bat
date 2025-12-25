@echo off
REM FreelanceManager - Production Health Check

echo ========================================
echo FreelanceManager - Health Check
echo ========================================
echo.

echo Container Status:
docker ps --filter "name=freelance-manager" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.

echo Application Health:
curl -s http://localhost:3001/api/health
echo.
echo.

echo Recent Logs (last 20 lines):
docker logs --tail 20 freelance-manager-prod
echo.

pause
