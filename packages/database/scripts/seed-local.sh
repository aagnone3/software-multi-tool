#!/usr/bin/env bash
# Seed the local development database with realistic test data
# Uses the same seed.sql that Supabase preview branches use
#
# Usage: pnpm --filter @repo/database seed

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
SEED_FILE="$REPO_ROOT/supabase/seed.sql"

# Default local database settings (can be overridden via env vars)
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DATABASE:-local_softwaremultitool}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_PASSWORD="${POSTGRES_PASSWORD:-postgres}"

echo "🌱 Seeding local database..."
echo "   Host: $DB_HOST:$DB_PORT"
echo "   Database: $DB_NAME"
echo "   Seed file: $SEED_FILE"
echo ""

# Check if seed file exists
if [ ! -f "$SEED_FILE" ]; then
    echo "❌ Seed file not found: $SEED_FILE"
    exit 1
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql command not found. Please install PostgreSQL client tools."
    echo "   brew install postgresql"
    exit 1
fi

# Check database connectivity
if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" &> /dev/null; then
    echo "❌ Cannot connect to database. Is PostgreSQL running?"
    echo ""
    echo "   To start PostgreSQL:"
    echo "     brew services start postgresql@15"
    echo ""
    echo "   To create the database:"
    echo "     PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d template1 -c \"CREATE DATABASE $DB_NAME;\""
    exit 1
fi

# Run the seed file
echo "Running seed.sql..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SEED_FILE"

echo ""
echo "✅ Database seeded successfully!"
echo ""
echo "Test credentials:"
echo "   Email:    test@preview.local"
echo "   Password: PreviewPassword123!"
