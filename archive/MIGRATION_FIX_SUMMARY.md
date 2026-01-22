# Migration Fix Summary - 2025-12-09

## Problem
The Prisma migration `20251208175358_add_scheduled_issues` failed during execution, leaving the database in an inconsistent state. This caused the backend to fail on startup with error `P3009`.

## Root Cause
The migration partially executed:
- Created the `ScheduleFrequency` enum type
- Failed before creating the `mm_scheduled_issue` table
- Left the migration marked as "failed" in Prisma's migration tracking table

## Solution Applied

### Step 1: Mark Migration as Rolled Back
```bash
cd /home/arthur/agb/momentum_manager/backend
export DATABASE_URL="postgresql://mm_admin_dev:mm_password_dev@localhost:5434/mm_primary_dev"
npx prisma migrate resolve --rolled-back 20251208175358_add_scheduled_issues --schema=./prisma/schema.prisma
```

### Step 2: Clean Up Partial Artifacts
```bash
cd /home/arthur/agb/momentum_manager
sudo docker compose -f docker-compose.dev.yml exec -T postgres_dev psql -U mm_admin_dev -d mm_primary_dev -c "DROP TYPE IF EXISTS momentum.\"ScheduleFrequency\" CASCADE; DROP TABLE IF EXISTS momentum.mm_scheduled_issue CASCADE;"
```

### Step 3: Mark Migration as Applied (Tracking Only)
```bash
cd /home/arthur/agb/momentum_manager/backend
export DATABASE_URL="postgresql://mm_admin_dev:mm_password_dev@localhost:5434/mm_primary_dev"
npx prisma migrate resolve --applied 20251208175358_add_scheduled_issues --schema=./prisma/schema.prisma
```

### Step 4: Manually Apply the Migration SQL
```bash
cd /home/arthur/agb/momentum_manager
sudo docker compose -f docker-compose.dev.yml exec -T postgres_dev psql -U mm_admin_dev -d mm_primary_dev < backend/prisma/migrations/20251208175358_add_scheduled_issues/migration.sql
```

This created:
- ✅ `momentum.ScheduleFrequency` enum type
- ✅ `momentum.mm_scheduled_issue` table
- ✅ Index on `board_id`
- ✅ Foreign key constraint to `mm_board`

### Step 5: Restart Backend
```bash
sudo docker compose -f docker-compose.dev.yml restart backend_dev
```

## Result
✅ Backend now starts successfully without migration errors
✅ The `mm_scheduled_issue` table exists and is accessible
✅ Scheduler service starts without errors

## Files Created During Fix
- `/home/arthur/agb/momentum_manager/fix_migration.sh` - Automated fix script
- `/home/arthur/agb/momentum_manager/backend/prisma/fix_migration.sql` - Cleanup SQL
- `/home/arthur/agb/momentum_manager/backend/prisma/verify_and_fix.sql` - Alternative fix SQL

## Important Notes
- When running Prisma commands from the host machine (not Docker), use `DATABASE_URL` with `localhost:5434` instead of `postgres_dev:5432`
- The Docker container uses `postgres_dev:5432` internally
- Port 5434 on localhost is mapped to port 5432 in the postgres_dev container

## Future Prevention
If this happens again:
1. Check Prisma's `_prisma_migrations` table for failed migrations
2. Use `prisma migrate resolve` to mark migrations as rolled back
3. Clean up any partial database objects
4. Re-apply the migration SQL manually if needed
5. Mark as applied in Prisma's tracking
