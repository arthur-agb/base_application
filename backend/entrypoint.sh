#!/bin/bash
set -e

echo "Waiting for PostgreSQL to be ready..."
until PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q'
do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "PostgreSQL is up - applying Prisma migrations..."
npx prisma migrate deploy --schema=./prisma/schema.prisma

echo "Starting backend application..."
npm run dev