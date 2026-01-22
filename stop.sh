#!/bin/bash
# stop.sh - Unified stop script for Momentum Manager
# Usage: ./stop.sh [local|dev|uat|prod]

set -e

ENV=$1

if [[ -z "$ENV" ]]; then
    echo "❌ Usage: ./stop.sh [local|dev|uat|prod]"
    exit 1
fi

case $ENV in
    local)
        COMPOSE_FILE="docker-compose.local.yml"
        ENV_FILE=".env.local"
        ;;
    dev)
        COMPOSE_FILE="docker-compose.dev.yml"
        ENV_FILE=".env.dev"
        ;;
    uat|prod)
        COMPOSE_FILE="docker-compose.prod.yml"
        ENV_FILE=".env.prod"
        ;;
    *)
        echo "❌ Invalid environment: $ENV. Use local, dev, uat, or prod."
        exit 1
        ;;
esac

echo "⏹️ Stopping $ENV environment..."
docker compose -f $COMPOSE_FILE --env-file $ENV_FILE down

echo "✅ Environment stopped."
