#!/bin/bash
# log.sh - View logs for a specific service and environment
# Usage: ./log.sh [service_name]
# Example: ./log.sh backend_local
# Example: ./log.sh frontend_dev
# Example: ./log.sh backend  (defaults to prod)

SERVICE=$1

if [[ -z "$SERVICE" ]]; then
    echo "❌ Usage: ./log.sh [service_name]"
    echo "   Example: ./log.sh backend_local"
    echo "   Example: ./log.sh backend_dev"
    echo "   Example: ./log.sh backend (for prod)"
    exit 1
fi

# Detect environment from service name suffix
if [[ "$SERVICE" == *"_local" ]]; then
    ENV="local"
elif [[ "$SERVICE" == *"_dev" ]]; then
    ENV="dev"
else
    # Default to production if no suffix or if service is explicitly prod
    ENV="prod"
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
    prod)
        COMPOSE_FILE="docker-compose.prod.yml"
        ENV_FILE=".env.prod"
        ;;
esac

echo "📑 Showing logs for $SERVICE in $ENV environment..."
docker compose -f $COMPOSE_FILE --env-file $ENV_FILE logs -f $SERVICE
