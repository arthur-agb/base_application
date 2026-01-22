#!/bin/bash
# backup.sh - Unified backup script for Momentum Manager
# Usage: ./backup.sh [local|uat|prod]

set -e

ENV=$1

if [[ -z "$ENV" ]]; then
    echo "❌ Usage: ./backup.sh [local|dev|uat|prod]"
    exit 1
fi

case $ENV in
    local)
        ENV_FILE=".env.local"
        DB_CONTAINER="mm_postgres_local"
        ;;
    dev)
        ENV_FILE=".env.dev"
        DB_CONTAINER="mm_postgres_dev"
        ;;
    uat|prod)
        ENV_FILE=".env.prod"
        # Both UAT and Prod on cloud use the production container name
        DB_CONTAINER="mm_postgres_prod"
        ;;
    *)
        echo "❌ Invalid environment: $ENV. Use local, dev, uat, or prod."
        exit 1
        ;;
esac

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_USER=$(grep POSTGRES_USER $ENV_FILE | cut -d '=' -f2)
DB_NAME=$(grep POSTGRES_DB $ENV_FILE | cut -d '=' -f2)
BACKUP_FILE="backup_${ENV}_${DB_NAME}_${TIMESTAMP}.sql"

echo "📦 Starting $ENV database backup..."
echo "   Container: $DB_CONTAINER"
echo "   Database:  $DB_NAME"
echo "   Output:    $BACKUP_FILE"

# Execute pg_dump inside the container
if docker exec -t $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME > $BACKUP_FILE; then
    echo "✅ Backup completed successfully: $BACKUP_FILE"
else
    echo "❌ Backup failed!"
    exit 1
fi
