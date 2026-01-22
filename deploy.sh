#!/bin/bash
# deploy.sh - Unified deployment script for Momentum Manager
# Usage: ./deploy.sh [local|uat|prod] [branch_to_merge_from]

set -e

ENV=$1
BRANCH=$2

if [[ -z "$ENV" ]]; then
    echo "❌ Usage: ./deploy.sh [local|dev|uat|prod] [branch_name]"
    echo "   Example: ./deploy.sh uat dev  (Merges dev into uat and deploys)"
    exit 1
fi

case $ENV in
    local)
        COMPOSE_FILE="docker-compose.local.yml"
        ENV_FILE=".env.local"
        DB_CONTAINER="mm_postgres_local"
        echo "🚀 Refreshing LOCAL environment..."
        ;;
    dev)
        COMPOSE_FILE="docker-compose.dev.yml"
        ENV_FILE=".env.dev"
        DB_CONTAINER="mm_postgres_dev"
        echo "🚀 Refreshing DEV environment..."
        ;;
    uat)
        COMPOSE_FILE="docker-compose.prod.yml"
        ENV_FILE=".env.prod"
        DB_CONTAINER="mm_postgres_prod"
        BRANCH=${BRANCH:-dev}
        echo "🚀 Deploying to UAT (Cloud)..."
        echo "📥 Fetching latest changes..."
        git fetch origin
        echo "🔀 Merging origin/$BRANCH into uat..."
        git checkout uat
        git merge origin/$BRANCH --no-edit
        ;;
    prod)
        COMPOSE_FILE="docker-compose.prod.yml"
        ENV_FILE=".env.prod"
        DB_CONTAINER="mm_postgres_prod"
        echo "🚀 Deploying to PRODUCTION (Cloud)..."
        echo "📥 Pulling latest code from main..."
        git checkout main
        git pull origin main --no-edit
        ;;
    *)
        echo "❌ Invalid environment: $ENV. Consult README.md for options. [local|dev|uat|prod]"
        exit 1
        ;;
esac

echo "🔨 Building containers..."
docker compose -f $COMPOSE_FILE --env-file $ENV_FILE build

echo "⏹️ Stopping application containers..."
docker compose -f $COMPOSE_FILE --env-file $ENV_FILE down

echo "🗄️ Starting Database..."
# In prod files, the service name is 'postgres'. In local/dev files, it's postgres_local/dev.
if [[ "$ENV" == "local" ]]; then
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d postgres_local
elif [[ "$ENV" == "dev" ]]; then
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d postgres_dev
else
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d postgres
fi

echo "⏳ Waiting for Database to be ready..."
sleep 10

echo "🔄 Running Prisma Migrations..."
if [[ "$ENV" == "local" ]]; then
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE run --rm backend_local npx prisma migrate deploy
elif [[ "$ENV" == "dev" ]]; then
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE run --rm backend_dev npx prisma migrate deploy
else
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE run --rm backend npx prisma migrate deploy
fi

if [[ -f "backend/prisma/ensure_plans.sql" ]]; then
    echo "🌱 Seeding Critical Data (Plans)..."
    DB_USER=$(grep "^POSTGRES_USER=" $ENV_FILE | cut -d '=' -f2 | xargs)
    DB_NAME=$(grep "^POSTGRES_DB=" $ENV_FILE | cut -d '=' -f2 | xargs)
    
    # If variables are empty, try extracting from DATABASE_URL as fallback
    if [[ -z "$DB_USER" ]] || [[ -z "$DB_NAME" ]]; then
        # Example: postgresql://user:pass@host:port/dbname
        DB_URL=$(grep "^DATABASE_URL=" $ENV_FILE | cut -d '=' -f2 | xargs)
        # Extract user and dbname from URL using sed
        [[ -z "$DB_USER" ]] && DB_USER=$(echo $DB_URL | sed -re 's|postgresql://([^:]+):.*|\1|')
        [[ -z "$DB_NAME" ]] && DB_NAME=$(echo $DB_URL | sed -re 's|.*/([^?]+).*|\1|')
    fi

    echo "   Using User: $DB_USER, DB: $DB_NAME"
    cat backend/prisma/ensure_plans.sql | docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME
fi

echo "🚀 Starting full application..."
docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d

echo "✅ Deployment Complete!"
