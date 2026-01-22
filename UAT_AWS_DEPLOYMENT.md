# UAT (AWS) Deployment Instructions

## Overview
The UAT environment runs on AWS using the `uat` branch with production configuration files (`.prod`). This guide walks you through deploying the multi-tenancy update.

## Pre-Deployment Steps

### 1. SSH into AWS Instance
```bash
ssh your-aws-instance
```

### 2. Navigate to Project Directory
```bash
cd /path/to/momentum_manager
```

### 3. **CRITICAL: Backup the Database**
```bash
./backup_prod.sh
```
This creates a timestamped backup file. **Do not proceed without a backup!**

## Deployment Process

The deployment script handles everything automatically:

```bash
./deploy_uat_aws.sh
```

### What the Script Does:
1. ✅ Fetches latest changes from origin
2. ✅ Checks out `uat` branch
3. ✅ Merges `origin/dev` into `uat` (with --no-edit)
4. ✅ Builds Docker containers
5. ✅ Stops application (keeps DB running)
6. ✅ Applies database migrations
7. ✅ Seeds critical data (pricing plans)
8. ✅ Restarts all services

**You do NOT need to manually pull or merge** - the script handles all git operations.

## Post-Deployment Verification

### 1. Check Backend Logs
```bash
sudo docker logs -f $(sudo docker ps -qf "name=backend")
```

Look for these success messages:
- `✅ Initialized global variables successfully.`
- `CompanyRoleDescription table populated successfully.`
- `Server running in production mode on port 5000`

Press `Ctrl+C` to exit logs.

### 2. Test the Website
- Log in to the UAT website
- Verify existing user profiles are intact
- Test creating/viewing projects and issues
- Test company context switching (if applicable)

## If Something Goes Wrong

### Restore from Backup
```bash
# Stop the application
sudo docker compose -f docker-compose.prod.yml --env-file .env.production down

# Restore the database
cat backup_prod_TIMESTAMP.sql | sudo docker exec -i mm_postgres_prod psql -U mm_admin_prod -d mm_primary_prod

# Restart the application
sudo docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

### Check for Errors
```bash
# Backend logs
sudo docker logs $(sudo docker ps -qf "name=backend")

# Database logs
sudo docker logs mm_postgres_prod

# All containers status
sudo docker ps -a
```

## Manual Deployment (If Script Fails)

If the automated script fails, you can run steps manually:

```bash
# 1. Update code
git fetch origin
git checkout uat
git merge origin/dev --no-edit

# 2. Build containers
sudo docker compose -f docker-compose.prod.yml --env-file .env.production build

# 3. Stop app, keep DB
sudo docker compose -f docker-compose.prod.yml --env-file .env.production down
sudo docker compose -f docker-compose.prod.yml --env-file .env.production up -d postgres

# 4. Wait for DB
sleep 10

# 5. Run migrations
sudo docker compose -f docker-compose.prod.yml --env-file .env.production run --rm backend npx prisma migrate deploy

# 6. Seed plans
cat backend/prisma/ensure_plans.sql | sudo docker exec -i mm_postgres_prod psql -U mm_admin_prod -d mm_primary_prod

# 7. Start all services
sudo docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

## Summary

**On AWS UAT instance, you only need to run:**
1. `./backup_prod.sh` (backup database)
2. `./deploy_uat_aws.sh` (run deployment)
3. Test the website

The script handles all git operations, migrations, and service restarts automatically.
