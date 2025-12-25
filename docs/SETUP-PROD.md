# Production Setup - Quick Start Guide

**5-minute setup to get your production deployment running!**

## ✅ Checklist

- [ ] Docker Desktop running
- [ ] Git repository pushed to GitHub
- [ ] Production infrastructure started
- [ ] `.env.prod` configured
- [ ] First deployment completed

---

## Step 1: Start Production Infrastructure (2 min)

```bash
cd D:\workspace\agentpro\env\infrastructure
scripts\start-prod.bat
```

**Verify services are running:**
```bash
docker ps --filter name=infrastructure-prod
```

You should see:
- ✅ infrastructure-postgres-prod
- ✅ infrastructure-redis-prod
- ✅ infrastructure-n8n-prod
- ✅ infrastructure-rabbitmq-prod
- ✅ infrastructure-nginx-prod

---

## Step 2: Configure Production Environment (1 min)

```bash
cd D:\workspace\freelance\freelance-manager

# Copy template
copy .env.prod.example .env.prod
```

**Edit `.env.prod` and update these values:**

```bash
# 1. Get PostgreSQL password from infrastructure
cd D:\workspace\agentpro\env\infrastructure\prod
type .env | findstr POSTGRES_PASSWORD

# 2. Update DATABASE_URL in .env.prod
DATABASE_URL="postgresql://postgres:YOUR_PROD_PASSWORD_HERE@host.docker.internal:5433/freelance_manager_prod"

# 3. Generate NEXTAUTH_SECRET
openssl rand -base64 32
# Copy output to NEXTAUTH_SECRET in .env.prod

# 4. Update your URL (or keep localhost for now)
NEXTAUTH_URL="http://localhost:3001"
```

**Minimal working `.env.prod`:**
```env
NODE_ENV=production
DATABASE_URL="postgresql://postgres:ewvy6aUf2NC4lsa2tcY+Vcpkg2GGklzLsELhxXUEjh0=@host.docker.internal:5433/freelance_manager_prod"
NEXTAUTH_SECRET="kJ8x2mN9pQ4rT7vW0yZ3aC6fH9kM2nP5sU8xB1dG4jL7="
NEXTAUTH_URL="http://localhost:3001"
```

---

## Step 3: First Deployment (2 min)

```bash
cd D:\workspace\freelance\freelance-manager

# Deploy version 1.0.0
npm run deploy:prod v1.0.0
```

**What happens:**
1. ✅ Checks Docker is running
2. ✅ Verifies infrastructure is running
3. ✅ Creates `freelance_manager_prod` database
4. ✅ Pulls latest code from GitHub
5. ✅ Builds Docker image
6. ✅ Runs database migrations
7. ✅ Starts application container
8. ✅ Runs health check

---

## Step 4: Verify (30 seconds)

**Open in browser:**
- Application: http://localhost:3001
- Health check: http://localhost:3001/api/health

**Check status:**
```bash
npm run deploy:health
```

**Expected output:**
```
Container Status:
freelance-manager-prod   Up About a minute (healthy)   127.0.0.1:3001->3000/tcp

Application Health:
{"status":"ok","timestamp":"2025-12-25T...","database":"connected"}
```

---

## ✨ You're Done!

**Your production application is running at:** http://localhost:3001

---

## Next: Update and Deploy

### Deploy Code Changes

```bash
# 1. Make changes and commit
git add .
git commit -m "Update feature"
git push origin main

# 2. Deploy new version
npm run deploy:prod v1.0.1
```

### Rollback if Needed

```bash
npm run deploy:rollback v1.0.0
```

### View Logs

```bash
npm run docker:logs
```

---

## Common Commands

| Task | Command |
|------|---------|
| **Deploy** | `npm run deploy:prod v1.0.0` |
| **Rollback** | `npm run deploy:rollback v1.0.0` |
| **Health Check** | `npm run deploy:health` |
| **View Logs** | `npm run docker:logs` |
| **Stop App** | `npm run docker:stop` |
| **Restart App** | `npm run docker:run` |

---

## Troubleshooting

### "Docker is not running"
→ Start Docker Desktop

### "Infrastructure not running"
→ Run: `D:\workspace\agentpro\env\infrastructure\scripts\start-prod.bat`

### "Database connection failed"
→ Check `.env.prod` DATABASE_URL password matches infrastructure password

### "Health check failed"
→ Wait 30-40 seconds for app to start, then check logs: `npm run docker:logs`

### "Port 3001 already in use"
→ Stop existing container: `npm run docker:stop`

---

## What's Next?

- 📖 Read full docs: [PRODUCTION.md](./PRODUCTION.md)
- 🔄 Set up GitHub Actions: See [PRODUCTION.md#github-actions-cicd](./PRODUCTION.md#github-actions-cicd)
- 🌐 Configure domain and SSL
- 📊 Set up monitoring
- 💾 Configure automated backups

---

**Repository**: https://github.com/akvimal/freelancer
**Infrastructure**: AgentPro Prod Environment (ports 5433, 6380, 5679, 5673)
**Application**: Docker container on port 3001
