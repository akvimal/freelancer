@echo off
REM Check database status

echo ========================================
echo Database Status
echo ========================================
echo.

echo Infrastructure Services:
docker ps --filter "name=infrastructure" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo Databases:
docker exec infrastructure-postgres-dev psql -U postgres -c "\l" | find "freelance"

echo.
echo Tables in freelance_manager_dev:
docker exec infrastructure-postgres-dev psql -U postgres -d freelance_manager_dev -c "\dt"

echo.
echo Record Counts:
docker exec infrastructure-postgres-dev psql -U postgres -d freelance_manager_dev -c "SELECT 'Clients' as table_name, COUNT(*) as count FROM \"Client\" UNION ALL SELECT 'Invoices', COUNT(*) FROM \"Invoice\" UNION ALL SELECT 'Projects', COUNT(*) FROM \"Project\" UNION ALL SELECT 'Payments', COUNT(*) FROM \"Payment\";"

pause
