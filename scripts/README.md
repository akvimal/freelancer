# Scripts Directory

Helper scripts for managing FreelanceManager deployment and infrastructure.

## Quick Reference

### From Project Root

```bash
# Full deployment (recommended)
npm run deploy:dev

# Database management
npm run db:status        # View database status
npm run db:studio        # Open Prisma Studio
npm run db:migrate       # Run migrations
npm run db:reset         # Reset database (WARNING: deletes data!)

# Infrastructure
npm run infra:start      # Start dev infrastructure
npm run infra:stop       # Stop dev infrastructure

# Application
npm run dev              # Start app only
```

### Direct Script Execution

From the project root:

```bash
# Deployment
.\deploy-dev.bat

# Infrastructure
.\scripts\infra-start.bat
.\scripts\infra-stop.bat

# Database
.\scripts\db-status.bat
.\scripts\db-reset.bat
```

## Scripts

| Script | Purpose | Safe? |
|--------|---------|-------|
| `infra-start.bat` | Start dev infrastructure | ✓ |
| `infra-stop.bat` | Stop dev infrastructure | ✓ |
| `db-status.bat` | Show database info | ✓ |
| `db-reset.bat` | Reset database | ⚠️ Deletes data! |

## Need Help?

See [DEPLOY.md](../docs/DEPLOY.md) for comprehensive guide.
