# FreelanceManager - Documentation Index

Complete guide to all documentation in this project.

---

## Quick Links

| Document | Purpose | For |
|----------|---------|-----|
| **[README.md](../README.md)** | Project overview & features | Everyone |
| **[DEPLOY.md](./DEPLOY.md)** | Development deployment | Developers |
| **[SETUP-PROD.md](./SETUP-PROD.md)** | Quick production setup (5 min) | DevOps (Quick Start) |
| **[PRODUCTION.md](./PRODUCTION.md)** | Complete production guide | DevOps (Full Reference) |

---

## Documentation by Role

### For Developers

1. **Getting Started**
   - [README.md](../README.md) - Project overview, features, tech stack
   - [DEPLOY.md](./DEPLOY.md) - Local development setup

2. **Development Workflow**
   - [DEPLOY.md](./DEPLOY.md) - Commands, database management, troubleshooting
   - [scripts/README.md](../scripts/README.md) - Helper scripts reference

### For DevOps / Deployment

1. **Quick Start (First Time)**
   - [SETUP-PROD.md](./SETUP-PROD.md) - 5-minute production setup guide

2. **Complete Reference**
   - [PRODUCTION.md](./PRODUCTION.md) - Full production deployment guide
   - [scripts/deploy/README.md](../scripts/deploy/README.md) - Deployment scripts

3. **CI/CD**
   - `.github/workflows/ci.yml` - Continuous integration
   - `.github/workflows/deploy-prod.yml` - Production deployment automation

---

## Documentation by Topic

### Setup & Installation

| Topic | Document | Section |
|-------|----------|---------|
| **Development Setup** | [README.md](../README.md) | Getting Started |
| **Production Setup** | [SETUP-PROD.md](./SETUP-PROD.md) | Full Guide |
| **Infrastructure Setup** | [PRODUCTION.md](./PRODUCTION.md) | Infrastructure Setup |

### Deployment

| Topic | Document | Section |
|-------|----------|---------|
| **Dev Deployment** | [DEPLOY.md](./DEPLOY.md) | Quick Start, Workflows |
| **Prod Deployment** | [PRODUCTION.md](./PRODUCTION.md) | Deployment Methods |
| **Automated Deployment** | [PRODUCTION.md](./PRODUCTION.md) | GitHub Actions CI/CD |
| **Deployment Scripts** | [scripts/deploy/README.md](../scripts/deploy/README.md) | All Scripts |

### Database

| Topic | Document | Section |
|-------|----------|---------|
| **Dev Database** | [DEPLOY.md](./DEPLOY.md) | Database Management |
| **Prod Database** | [PRODUCTION.md](./PRODUCTION.md) | Database Operations |
| **Schema** | [README.md](../README.md) | Database Schema |

### Troubleshooting

| Topic | Document | Section |
|-------|----------|---------|
| **Dev Issues** | [DEPLOY.md](./DEPLOY.md) | Troubleshooting |
| **Prod Issues** | [PRODUCTION.md](./PRODUCTION.md) | Monitoring & Troubleshooting |
| **Script Issues** | [scripts/deploy/README.md](../scripts/deploy/README.md) | Troubleshooting |

---

## Common Tasks

### Development

```bash
# Start development
npm run deploy:dev          # See: docs/DEPLOY.md

# Database management
npm run db:status          # See: docs/DEPLOY.md
npm run db:studio          # See: docs/DEPLOY.md
npm run db:migrate:dev     # See: docs/DEPLOY.md
```

### Production

```bash
# Deploy to production
npm run deploy:prod v1.0.0   # See: docs/SETUP-PROD.md or docs/PRODUCTION.md

# Manage production
npm run deploy:health        # See: docs/PRODUCTION.md
npm run deploy:rollback      # See: docs/PRODUCTION.md
npm run docker:logs          # See: docs/PRODUCTION.md
```

---

## Documentation Structure

```
freelance-manager/
├── README.md                    # Project overview
├── docs/
│   ├── INDEX.md                # Documentation navigation (this file)
│   ├── DEPLOY.md               # Development guide
│   ├── SETUP-PROD.md          # Quick production setup
│   └── PRODUCTION.md          # Complete production guide
├── scripts/
│   ├── README.md               # Scripts overview
│   └── deploy/
│       └── README.md           # Deployment scripts
└── .github/
    └── workflows/              # GitHub Actions
        ├── ci.yml             # Continuous integration
        └── deploy-prod.yml    # Production deployment
```

---

## External Resources

- **Repository**: https://github.com/akvimal/freelancer
- **Infrastructure Docs**: `D:\workspace\agentpro\env\infrastructure\README.md`
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Docker Docs**: https://docs.docker.com

---

## Contributing

When adding new documentation:

1. Update this index file
2. Follow the existing documentation style
3. Link related documents
4. Include code examples
5. Add troubleshooting sections

---

**Last Updated**: 2025-12-25
**Maintainer**: Development Team
