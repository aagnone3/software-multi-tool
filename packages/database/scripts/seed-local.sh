#!/usr/bin/env bash
# Seed the local development database with realistic test data
# Uses the seed.sql from packages/database/
#
# Usage: pnpm --filter @repo/database seed

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
SEED_FILE="$REPO_ROOT/packages/database/seed.sql"

# Default local database settings (can be overridden via env vars)
DB_HOST="${POSTGRES_HOST:-127.0.0.1}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DATABASE:-local_softwaremultitool}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
DATABASE_URL="${DATABASE_URL:-postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}}"

echo "🌱 Seeding local database..."
echo "   Host: $DB_HOST:$DB_PORT"
echo "   Database: $DB_NAME"
echo "   Seed file: $SEED_FILE"
echo ""

if [ ! -f "$SEED_FILE" ]; then
    echo "❌ Seed file not found: $SEED_FILE"
    exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
    echo "❌ pnpm is required to run the repo-owned seed flow."
    echo "   Install pnpm, then retry."
    exit 1
fi

if ! DATABASE_URL="$DATABASE_URL" SEED_FILE="$SEED_FILE" pnpm --filter @repo/scripts exec node ./src/run-local-seed.mjs; then
    echo ""
    echo "❌ Failed to seed the local database."
    echo "   Confirm PostgreSQL is reachable at $DB_HOST:$DB_PORT and database '$DB_NAME' exists."
    exit 1
fi

echo ""
echo "✅ Database seeded successfully!"
echo ""
echo "Test credentials:"
echo "   Email:    test@preview.local"
echo "   Password: TestPassword123"
