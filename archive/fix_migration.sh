#!/bin/bash

echo "=== Fixing Failed Prisma Migration ==="
echo ""

# Change to project root
cd /home/arthur/agb/momentum_manager

# Set DATABASE_URL for local Prisma access (using localhost:5434 instead of postgres_dev:5432)
export DATABASE_URL="postgresql://mm_admin_dev:mm_password_dev@localhost:5434/mm_primary_dev"

echo "Step 1: Cleaning up partial migration..."
sudo docker compose -f docker-compose.dev.yml exec -T postgres_dev psql -U mm_admin_dev -d mm_primary_dev < backend/prisma/fix_migration.sql

if [ $? -eq 0 ]; then
    echo "✓ Cleanup successful"
else
    echo "✗ Cleanup failed - trying alternative approach..."
    sudo docker compose -f docker-compose.dev.yml exec -T postgres_dev psql -U mm_admin_dev -d mm_primary_dev < backend/prisma/verify_and_fix.sql
fi

echo ""
echo "Step 2: Deploying migrations..."
cd backend
npx prisma migrate deploy --schema=./prisma/schema.prisma

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Migration successful!"
    echo ""
    echo "Step 3: Generating Prisma Client..."
    npx prisma generate --schema=./prisma/schema.prisma
    echo ""
    echo "=== All Done! ==="
    echo "You can now restart your backend with:"
    echo "  cd /home/arthur/agb/momentum_manager"
    echo "  sudo docker compose -f docker-compose.dev.yml restart backend_dev"
else
    echo ""
    echo "✗ Migration failed. Trying to mark as applied..."
    npx prisma migrate resolve --applied 20251208175358_add_scheduled_issues --schema=./prisma/schema.prisma
    echo ""
    echo "Please check the database manually to verify the schema is correct."
fi
