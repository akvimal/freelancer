# FreelanceManager - Production Deployment Guide

Complete guide for deploying FreelanceManager to production using Docker and the AgentPro infrastructure.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Infrastructure Setup](#infrastructure-setup)
- [First Deployment](#first-deployment)
- [Deployment Methods](#deployment-methods)
- [Managing Production](#managing-production)
- [Monitoring & Troubleshooting](#monitoring--troubleshooting)
- [GitHub Actions CI/CD](#github-actions-cicd)

---

## Prerequisites

### Required

- ✅ Docker Desktop installed and running
- ✅ Git configured
- ✅ Node.js 20+ (for local builds)
- ✅ Access to GitHub repository: https://github.com/akvimal/freelancer.git
- ✅ AgentPro Prod Infrastructure (PostgreSQL, Redis, N8N, RabbitMQ)

### Optional

- GitHub Personal Access Token (for GitHub Actions)
- Domain name (for public deployment)
- SSL certificates (Let's Encrypt recommended)

---

## Quick Start

### 1. Start Production Infrastructure

```bash
cd D:\workspace\agentpro\env\infrastructure
scripts\start-prod.bat
```

**Production Services:**
- PostgreSQL: localhost:5433
- Redis: localhost:6380
- N8N: http://localhost:5679
- RabbitMQ: http://localhost:15673
- Nginx: http://localhost:8080

### 2. Create Production Environment File

```bash
cd D:\workspace\freelance\freelance-manager

# Copy template
copy .env.prod.example .env.prod

# Edit .env.prod and update:
# - Database password (from infrastructure/.env)
# - Redis password
# - RabbitMQ password
# - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)
# - Your domain URL
```

### 3. Deploy to Production

**Option A: One-Command Deployment (Recommended)**

```bash
npm run deploy:prod v1.0.0
```

**Option B: Manual Steps**

```bash
# Build Docker image
npm run docker:build

# Deploy
VERSION=v1.0.0 npm run docker:run

# Check health
npm run deploy:health
```

### 4. Verify Deployment

Open http://localhost:3001

---

## Infrastructure Setup

### Start Production Infrastructure

```bash
cd D:\workspace\agentpro\env\infrastructure
scripts\start-prod.bat
```

This starts:
- `infrastructure-postgres-prod` (port 5433)
- `infrastructure-redis-prod` (port 6380)
- `infrastructure-n8n-prod` (port 5679)
- `infrastructure-rabbitmq-prod` (port 5673, management: 15673)
- `infrastructure-nginx-prod` (ports 8080, 8443)

### Create Production Database

```bash
# Connect to PostgreSQL
docker exec -it infrastructure-postgres-prod psql -U postgres

# Create database
CREATE DATABASE freelance_manager_prod;

# Verify
\l
\q
```

### Configure Nginx (Optional)

For reverse proxy setup:

1. Edit `D:\workspace\agentpro\env\infrastructure\prod\data\nginx\conf.d\freelance-manager.conf`

```nginx
upstream freelance-manager-prod {
    server host.docker.internal:3001;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://freelance-manager-prod;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

2. Restart Nginx:
```bash
cd D:\workspace\agentpro\env\infrastructure\prod
docker-compose restart nginx
```

---

## First Deployment

### Step 1: Configure Environment

Create `.env.prod` from `.env.prod.example`:

```bash
# Required values (get from infrastructure/.env)
DATABASE_URL="postgresql://postgres:YOUR_PROD_PASSWORD@host.docker.internal:5433/freelance_manager_prod"
REDIS_URL="redis://:YOUR_REDIS_PASSWORD@host.docker.internal:6380"
RABBITMQ_URL="amqp://admin:YOUR_RABBIT_PASSWORD@host.docker.internal:5673"

# Generate a secret
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3001"
```

### Step 2: Initial Deployment

```bash
cd D:\workspace\freelance\freelance-manager

# Deploy version 1.0.0
scripts\deploy\deploy-prod.bat v1.0.0
```

**What this does:**
1. ✅ Checks Docker and infrastructure
2. ✅ Creates database if missing
3. ✅ Pulls latest code from GitHub
4. ✅ Builds Docker image
5. ✅ Runs database migrations
6. ✅ Starts application container
7. ✅ Performs health check

### Step 3: Verify

```bash
# Check status
npm run deploy:health

# View logs
npm run docker:logs

# Test endpoint
curl http://localhost:3001/api/health
```

---

## Deployment Methods

### Method 1: Script-Based Deployment (Recommended for Local)

**Deploy new version:**

```bash
npm run deploy:prod v1.1.0
```

**Rollback to previous version:**

```bash
npm run deploy:rollback v1.0.0
```

**Check health:**

```bash
npm run deploy:health
```

### Method 2: GitHub Actions (Automated CI/CD)

**Setup:**

1. Configure GitHub Secrets:
   - Go to GitHub repository → Settings → Secrets
   - Add secrets:
     - `PROD_HOST` - Your server IP/hostname
     - `PROD_USER` - SSH username
     - `PROD_SSH_KEY` - Private SSH key
     - `PROD_PORT` - SSH port (default: 22)

2. Push to main branch or create version tag:

```bash
# Deploy from main branch
git push origin main

# Or create version tag
git tag v1.0.0
git push origin v1.0.0
```

3. Monitor deployment:
   - GitHub → Actions tab
   - View workflow progress
   - Check deployment logs

### Method 3: Manual Docker Commands

```bash
cd D:\workspace\freelance\freelance-manager

# Pull latest code
git pull origin main

# Build image
docker build -t freelance-manager:v1.2.0 .

# Tag as latest
docker tag freelance-manager:v1.2.0 freelance-manager:latest

# Stop old version
docker-compose -f docker-compose.prod.yml down

# Start new version
VERSION=v1.2.0 docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Check logs
docker logs -f freelance-manager-prod
```

---

## Managing Production

### View Application Status

```bash
# Container status
docker ps --filter name=freelance

# Application health
curl http://localhost:3001/api/health

# View logs
docker logs -f freelance-manager-prod

# Last 100 lines
docker logs --tail 100 freelance-manager-prod
```

### Database Operations

```bash
# Connect to production database
docker exec -it infrastructure-postgres-prod psql -U postgres -d freelance_manager_prod

# Backup database
docker exec infrastructure-postgres-prod pg_dump -U postgres freelance_manager_prod > backup-$(date +%Y%m%d).sql

# Restore database
docker exec -i infrastructure-postgres-prod psql -U postgres freelance_manager_prod < backup-20250125.sql

# View Prisma Studio (production - BE CAREFUL!)
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5433/freelance_manager_prod" npx prisma studio
```

### Update Application

**Scenario 1: Code changes only (no schema changes)**

```bash
git pull origin main
npm run deploy:prod v1.0.1
```

**Scenario 2: Database schema changes**

```bash
# 1. Test migration locally first
npm run db:migrate:dev

# 2. Commit and push changes
git add prisma/
git commit -m "Update database schema"
git push origin main

# 3. Deploy (migrations run automatically)
npm run deploy:prod v1.1.0
```

### Rollback Deployment

```bash
# List available versions
docker images freelance-manager --format "{{.Tag}}"

# Rollback to specific version
npm run deploy:rollback v1.0.0

# Or manually
docker-compose -f docker-compose.prod.yml down
VERSION=v1.0.0 docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

### Scale (if needed)

```bash
# Run multiple instances (update docker-compose.prod.yml first)
docker-compose -f docker-compose.prod.yml up -d --scale app=3
```

---

## Monitoring & Troubleshooting

### Health Checks

**Automated:**
- Docker health check runs every 30s
- Endpoint: http://localhost:3001/api/health
- Checks: Database connectivity, application status

**Manual:**
```bash
npm run deploy:health
```

### Common Issues

#### Issue: Container keeps restarting

```bash
# Check logs
docker logs freelance-manager-prod

# Common causes:
# 1. Database connection failed (check .env.prod DATABASE_URL)
# 2. Missing environment variables
# 3. Migration failed
```

#### Issue: Database connection error

```bash
# Verify infrastructure is running
docker ps | grep infrastructure-postgres-prod

# Test database connection
docker exec infrastructure-postgres-prod psql -U postgres -c "SELECT 1"

# Check database exists
docker exec infrastructure-postgres-prod psql -U postgres -lqt | grep freelance_manager_prod
```

#### Issue: Health check failing

```bash
# Wait for application startup (can take 30-40 seconds)
sleep 40 && curl http://localhost:3001/api/health

# Check application logs
docker logs -f freelance-manager-prod

# Restart container
docker restart freelance-manager-prod
```

#### Issue: Port conflict

```bash
# Check what's using port 3001
netstat -ano | findstr :3001

# Kill process or change port in docker-compose.prod.yml
```

### Logs

**Application logs:**
```bash
# Follow logs
docker logs -f freelance-manager-prod

# Last 100 lines
docker logs --tail 100 freelance-manager-prod

# Save logs to file
docker logs freelance-manager-prod > logs-$(date +%Y%m%d).txt
```

**Infrastructure logs:**
```bash
cd D:\workspace\agentpro\env\infrastructure\prod

docker-compose logs -f postgres
docker-compose logs -f nginx
docker-compose logs -f redis
```

---

## GitHub Actions CI/CD

### Workflows

**1. CI (Continuous Integration)** - `.github/workflows/ci.yml`
- Triggers: Pull requests, pushes to `develop`
- Actions:
  - Lint code
  - Run migrations
  - Build application
  - Run tests (if available)

**2. Deploy to Production** - `.github/workflows/deploy-prod.yml`
- Triggers: Push to `main`, version tags (`v*`), manual
- Actions:
  - Build and test
  - Build Docker image
  - Push to GitHub Container Registry
  - Deploy to production server
  - Run health checks
  - Send notifications

### Setup GitHub Actions Deployment

**1. Create GitHub Secrets:**

Go to: https://github.com/akvimal/freelancer/settings/secrets/actions

Add:
```
PROD_HOST = your.server.ip
PROD_USER = deployment_user
PROD_SSH_KEY = -----BEGIN OPENSSH PRIVATE KEY-----
                ... your private key ...
                -----END OPENSSH PRIVATE KEY-----
PROD_PORT = 22
SLACK_WEBHOOK = https://hooks.slack.com/... (optional)
```

**2. Enable GitHub Actions:**
- Go to repository → Settings → Actions → General
- Enable "Read and write permissions"

**3. Deploy:**

```bash
# Method 1: Push to main
git push origin main

# Method 2: Create version tag
git tag v1.0.0
git push origin v1.0.0

# Method 3: Manual trigger
# Go to Actions tab → Deploy to Production → Run workflow
```

### Using GitHub Container Registry

Images are automatically pushed to: `ghcr.io/akvimal/freelancer`

**Pull image:**
```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u akvimal --password-stdin
docker pull ghcr.io/akvimal/freelancer:latest
```

---

## Security Best Practices

### Environment Variables

- ✅ Never commit `.env.prod` to git
- ✅ Use strong passwords (32+ characters)
- ✅ Rotate secrets regularly
- ✅ Use GitHub Secrets for CI/CD
- ✅ Limit secret access (principle of least privilege)

### Database

- ✅ Regular backups (daily recommended)
- ✅ Strong PostgreSQL password
- ✅ Database only accessible from localhost
- ✅ Use migrations for schema changes

### Docker

- ✅ Run as non-root user (already configured)
- ✅ Keep images updated
- ✅ Use specific version tags, not `latest` in production
- ✅ Scan images for vulnerabilities

### Network

- ✅ Services bound to 127.0.0.1 (localhost only)
- ✅ Use Nginx reverse proxy for external access
- ✅ Enable SSL/TLS (Let's Encrypt)
- ✅ Firewall configuration

---

## Backup & Recovery

### Database Backup

**Automated backup script:**

```bash
# Create backup
docker exec infrastructure-postgres-prod pg_dump -U postgres freelance_manager_prod | gzip > backup-$(date +%Y%m%d-%H%M%S).sql.gz

# Schedule daily backup (Windows Task Scheduler or cron)
```

**Restore from backup:**

```bash
# Unzip and restore
gunzip < backup-20250125-120000.sql.gz | docker exec -i infrastructure-postgres-prod psql -U postgres freelance_manager_prod
```

### Application Backup

- Source code: On GitHub
- Docker images: Version tagged
- Configuration: `.env.prod` (keep secure backup)
- Data: Database backups + file uploads (if any)

---

## Performance Optimization

### Docker Image Size

Current Dockerfile uses multi-stage builds:
- Dependencies stage: ~500MB
- Final image: ~200MB

### Database

- Indexes already configured in Prisma schema
- Connection pooling handled by Prisma
- Monitor slow queries: `docker logs freelance-manager-prod | grep "slow"`

### Caching

- Next.js automatic caching enabled
- Redis available for session/data caching
- Add Redis caching as needed

---

## NPM Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run deploy:prod v1.0.0` | Deploy to production |
| `npm run deploy:rollback v1.0.0` | Rollback to version |
| `npm run deploy:health` | Check production health |
| `npm run docker:build` | Build Docker image |
| `npm run docker:run` | Start production container |
| `npm run docker:stop` | Stop production container |
| `npm run docker:logs` | View production logs |

---

## Support

### Documentation

- Development: [DEPLOY.md](./DEPLOY.md)
- Infrastructure: `D:\workspace\agentpro\env\infrastructure\README.md`
- Repository: https://github.com/akvimal/freelancer

### Troubleshooting

1. Check logs: `npm run docker:logs`
2. Health check: `npm run deploy:health`
3. Infrastructure status: `docker ps --filter name=infrastructure`
4. Database connection: Test with Prisma Studio

### Emergency Rollback

```bash
# Quick rollback to last working version
npm run deploy:rollback v1.0.0

# If container won't stop
docker rm -f freelance-manager-prod
VERSION=v1.0.0 npm run docker:run
```

---

## Next Steps

- [ ] Configure domain and SSL certificates
- [ ] Set up automated backups
- [ ] Configure monitoring (Uptime Kuma, Grafana)
- [ ] Set up error tracking (Sentry)
- [ ] Configure email notifications
- [ ] Load testing
- [ ] Disaster recovery plan

---

**Production URL**: http://localhost:3001
**Repository**: https://github.com/akvimal/freelancer
**Infrastructure**: AgentPro Prod Environment
