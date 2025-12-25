# Production Deployment Scripts

Automated deployment scripts for FreelanceManager production environment.

## Scripts

### `deploy-prod.bat` - Full Production Deployment

**Usage:**
```bash
cd D:\workspace\freelance\freelance-manager
npm run deploy:prod v1.0.0
```

Or directly:
```bash
scripts\deploy\deploy-prod.bat v1.0.0
```

**What it does:**
1. Pre-deployment checks (Docker, .env.prod)
2. Starts infrastructure if needed
3. Creates database if missing
4. Pulls latest code from GitHub
5. Builds Docker image
6. Tags image with version
7. Stops old version
8. Starts new version
9. Runs health check

**Requirements:**
- Version number required (e.g., v1.0.0)
- `.env.prod` file must exist
- Production infrastructure running
- GitHub repository up to date

---

### `rollback.bat` - Rollback to Previous Version

**Usage:**
```bash
npm run deploy:rollback v1.0.0
```

Or directly:
```bash
scripts\deploy\rollback.bat v1.0.0
```

**What it does:**
1. Verifies version exists
2. Stops current version
3. Starts specified version
4. Runs health check

**List available versions:**
```bash
docker images freelance-manager --format "{{.Tag}}"
```

---

### `health-check.bat` - Production Health Check

**Usage:**
```bash
npm run deploy:health
```

Or directly:
```bash
scripts\deploy\health-check.bat
```

**Shows:**
- Container status
- Application health (API endpoint)
- Recent logs (last 20 lines)

---

## Typical Workflow

### First Deployment

```bash
# 1. Configure environment
copy .env.prod.example .env.prod
# Edit .env.prod

# 2. Deploy
npm run deploy:prod v1.0.0

# 3. Verify
npm run deploy:health
```

### Update Deployment

```bash
# 1. Commit and push changes
git add .
git commit -m "Feature update"
git push origin main

# 2. Deploy new version
npm run deploy:prod v1.1.0
```

### Emergency Rollback

```bash
# Rollback to last working version
npm run deploy:rollback v1.0.0
```

---

## Environment Variables

Required in `.env.prod`:

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://...
```

Optional:
```env
REDIS_URL=redis://...
RABBITMQ_URL=amqp://...
```

---

## Versioning

Use semantic versioning: `vMAJOR.MINOR.PATCH`

Examples:
- `v1.0.0` - Initial release
- `v1.0.1` - Bug fix
- `v1.1.0` - New feature
- `v2.0.0` - Breaking change

---

## Troubleshooting

### "Version is required"
→ Provide version: `npm run deploy:prod v1.0.0`

### "Docker is not running"
→ Start Docker Desktop

### ".env.prod file not found"
→ Create from template: `copy .env.prod.example .env.prod`

### "Infrastructure not running"
→ Scripts will auto-start it, or manually run:
  `D:\workspace\agentpro\env\infrastructure\scripts\start-prod.bat`

### "Health check failed"
→ Check logs: `docker logs freelance-manager-prod`
→ Verify database connection in `.env.prod`

---

## See Also

- [SETUP-PROD.md](../../docs/SETUP-PROD.md) - Quick start guide
- [PRODUCTION.md](../../docs/PRODUCTION.md) - Complete production documentation
- [DEPLOY.md](../../docs/DEPLOY.md) - Development deployment

---

**Repository**: https://github.com/akvimal/freelancer
