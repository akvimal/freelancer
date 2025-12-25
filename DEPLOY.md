# FreelanceManager - Deployment Guide

This guide explains how to deploy and manage FreelanceManager with the AgentPro dev infrastructure.

## Quick Start

### One-Command Deployment

From the project folder, run:

```bash
npm run deploy:dev
```

This single command will:
1. Check if Docker is running
2. Start dev infrastructure if needed
3. Ensure database exists
4. Run migrations
5. Start the Next.js application

Then open http://localhost:3000

## Available Commands

### Deployment

```bash
# Full deployment (infrastructure + app)
npm run deploy:dev

# Or manually
deploy-dev.bat
```

### Infrastructure Management

```bash
# Start dev infrastructure only
npm run infra:start

# Stop dev infrastructure
npm run infra:stop
```

### Database Management

```bash
# View database status and record counts
npm run db:status

# Run migrations (production-safe)
npm run db:migrate

# Create new migration (development)
npm run db:migrate:dev

# Generate Prisma client
npm run db:generate

# Open Prisma Studio (visual database editor)
npm run db:studio

# Reset database (WARNING: deletes all data!)
npm run db:reset
```

### Application

```bash
# Start app only (assumes infrastructure is running)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Typical Workflows

### Daily Development

**Option 1: Quick Start**
```bash
npm run deploy:dev
```

**Option 2: Manual Control**
```bash
# Start infrastructure (once per day)
npm run infra:start

# Start app (each time you work)
npm run dev
```

### After Schema Changes

```bash
# Create migration
npm run db:migrate:dev

# Generate Prisma client
npm run db:generate

# Restart app
npm run dev
```

### View/Edit Data

```bash
# Open Prisma Studio
npm run db:studio
# Opens http://localhost:5555
```

### Check Database Status

```bash
npm run db:status
```

Shows:
- Running services
- Databases
- Tables
- Record counts

### Fresh Start

```bash
# Reset database (deletes all data!)
npm run db:reset

# Start app
npm run deploy:dev
```

## Infrastructure Details

### Connection Information

**PostgreSQL:**
- Host: localhost
- Port: 5432
- Database: freelance_manager_dev
- Username: postgres
- Password: dev_pg_2024!

**Redis:**
- Host: localhost
- Port: 6379
- Password: dev_redis_2024!

**RabbitMQ:**
- Host: localhost
- AMQP Port: 5672
- Management UI: http://localhost:15672
- Username: admin
- Password: dev_rabbit_2024!

**N8N:**
- URL: http://localhost:5678

**Nginx:**
- URL: http://localhost

### Environment Files

**Development:**
- `.env` - Points to PostgreSQL dev infrastructure

## Script Files

### Main Scripts

| File | Purpose |
|------|---------|
| `deploy-dev.bat` | Full deployment automation |
| `scripts/infra-start.bat` | Start infrastructure only |
| `scripts/infra-stop.bat` | Stop infrastructure |
| `scripts/db-status.bat` | Check database status |
| `scripts/db-reset.bat` | Reset database (with confirmation) |

### Direct Access

You can also run scripts directly:

```bash
# From project root
.\deploy-dev.bat

# Or from anywhere
cd D:\workspace\freelance\freelance-manager
.\scripts\db-status.bat
```

## Troubleshooting

### Port Already in Use

If you see "Port 3000 is in use":

```bash
# Windows - Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual number)
taskkill /PID <pid> /F

# Or restart the app
npm run dev
```

### Infrastructure Not Starting

```bash
# Check Docker is running
docker info

# View infrastructure logs
cd D:\workspace\agentpro\env\infrastructure\dev
docker-compose logs -f

# Restart infrastructure
npm run infra:stop
npm run infra:start
```

### Migration Errors

```bash
# Generate Prisma client first
npm run db:generate

# Then try migration
npm run db:migrate
```

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker ps | findstr postgres

# Check database exists
npm run db:status

# Restart infrastructure
npm run infra:stop
npm run infra:start
```

### Lock File Issues

If Next.js says another instance is running:

```bash
# Remove lock file
del .next\dev\lock

# Restart
npm run dev
```

## Advanced

### Manual Infrastructure Control

```bash
cd D:\workspace\agentpro\env\infrastructure\dev

# Start all services
docker-compose up -d

# Start specific services
docker-compose up -d postgres redis

# View logs
docker-compose logs -f postgres

# Stop all
docker-compose stop

# Remove containers (keeps data)
docker-compose down

# Remove everything including data (DANGER!)
docker-compose down -v
```

### Direct Database Access

```bash
# Connect to PostgreSQL
docker exec -it infrastructure-postgres-dev psql -U postgres -d freelance_manager_dev

# Inside psql:
\dt              # List tables
\d "Client"      # Describe Client table
SELECT * FROM "Client";
\q               # Quit
```

### Multiple Projects

If you have other projects using the same infrastructure:

1. They share PostgreSQL, Redis, N8N, etc.
2. Each project has its own database (e.g., `project_a_dev`, `project_b_dev`)
3. Infrastructure stays running for all projects
4. Stop infrastructure only when done with ALL projects

## Production Deployment

This guide is for **development** environment only.

For production:
1. Use strong passwords
2. Start prod infrastructure: `D:\workspace\agentpro\env\infrastructure\scripts\start-prod.bat`
3. Update `.env` to point to prod database
4. Build application: `npm run build`
5. Start production server: `npm start`

## Support

For infrastructure issues, check:
- Infrastructure README: `D:\workspace\agentpro\env\infrastructure\README.md`
- Docker logs: `docker-compose logs -f`
- Service health: `npm run db:status`
