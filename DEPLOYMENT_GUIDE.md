# Deployment Guide

This guide outlines the steps to deploy updates to the Local, Dev, UAT, and Production environments. The unified scripts handle database migrations, data seeding, and service restarts.

## ⚠️ Critical Prerequisites

1.  **Backup**: Ensure a full database backup is taken before running any deployment commands.
    *   **Local**: `./backup.sh local`
    *   **Dev**: `./backup.sh dev`
    *   **UAT**: `./backup.sh uat`
    *   **Production**: `./backup.sh prod`
2.  **Downtime**: The deployment requires a brief downtime to apply migrations and restart services.

## Unified Deployment Scripts

We have created unified deployment scripts that work across all environments:

### Backup Script (`backup.sh`)
Creates a timestamped database backup for the specified environment.

**Usage:**
```bash
./backup.sh [local|dev|uat|prod]
```

**Examples:**
```bash
./backup.sh uat     # Backup UAT database
./backup.sh prod    # Backup Production database
```

### Deployment Script (`deploy.sh`)
Performs a complete deployment including code updates, migrations, and service restarts.

**Usage:**
```bash
./deploy.sh [local|dev|uat|prod] [branch_to_merge]
```

**Examples:**
```bash
./deploy.sh uat dev     # Deploy to UAT, merging from dev branch
./deploy.sh prod        # Deploy to Production from main branch
./deploy.sh local       # Refresh local environment
```

**The script performs these actions:**
1.  Fetches/pulls latest code (UAT/Prod only)
2.  Merges specified branch (UAT only)
3.  Builds Docker containers
4.  Stops the running application
5.  Starts the PostgreSQL container in isolation
6.  Applies Prisma migrations
7.  Seeds critical data (pricing plans)
8.  Starts all services

## Deployment Workflow

### For UAT Deployment:
```bash
# 1. Create backup
./backup.sh uat

# 2. Deploy (merges dev into uat)
./deploy.sh uat dev

# 3. Verify deployment (see Post-Deployment Verification below)
```

### For Production Deployment:
```bash
# 1. Create backup
./backup.sh prod

# 2. Deploy (pulls from main)
./deploy.sh prod

# 3. Verify deployment (see Post-Deployment Verification below)
```

## Manual Verification Steps (If Script Fails)

### For UAT:
1.  **Update Code**: `git fetch origin && git checkout uat && git merge origin/dev --no-edit`
2.  **Rebuild**: `docker compose -f docker-compose.prod.yml --env-file .env.prod build`
3.  **Restart DB**: `docker compose -f docker-compose.prod.yml --env-file .env.prod up -d postgres`
4.  **Migrate**: `docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm backend npx prisma migrate deploy`
5.  **Seed Plans**:
    ```bash
    cat backend/prisma/ensure_plans.sql | docker exec -i mm_postgres_prod psql -U [DB_USER] -d [DB_NAME]
    ```
6.  **Start All**: `docker compose -f docker-compose.prod.yml --env-file .env.prod up -d`

### For Production:
1.  **Update Code**: `git checkout main && git pull origin main --no-edit`
2.  **Rebuild**: `docker compose -f docker-compose.prod.yml --env-file .env.prod build`
3.  **Restart DB**: `docker compose -f docker-compose.prod.yml --env-file .env.prod up -d postgres`
4.  **Migrate**: `docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm backend npx prisma migrate deploy`
5.  **Seed Plans**:
    ```bash
    cat backend/prisma/ensure_plans.sql | docker exec -i mm_postgres_prod psql -U [DB_USER] -d [DB_NAME]
    ```
6.  **Start All**: `docker compose -f docker-compose.prod.yml --env-file .env.prod up -d`

## Post-Deployment Verification

### For UAT/Production:
1.  **Check Logs**: 
    ```bash
    docker logs -f $(docker ps -qf "name=backend")
    ```
    Look for:
    *   ✅ `Initialized global variables successfully.`
    *   ✅ `CompanyRoleDescription table populated successfully.`
    *   ✅ `Server running on port...`

2.  **Test Application**:
    *   Log in to the application
    *   Verify core functionality works
    *   Check any new features deployed

## Database Restore (If Needed)

If something goes wrong and you need to restore from backup:

```bash
# Find your backup file (format: backup_[env]_[dbname]_[timestamp].sql)
cat backup_uat_mm_primary_prod_20260115_223000.sql | docker exec -i mm_postgres_prod psql -U [DB_USER] -d [DB_NAME]
```

## Environment-Specific Notes

- **Local/Dev**: Uses separate compose files and database containers
- **UAT**: Uses production compose file with .env.prod, shares container naming with prod
- **Production**: Uses production compose file with .env.prod, pulls from main branch only
