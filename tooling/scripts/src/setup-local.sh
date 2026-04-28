#!/bin/bash
# setup-local.sh - Unified local development environment setup
#
# This script ensures all prerequisites are in place for local development:
# 1. PostgreSQL is running (via Docker Compose)
# 2. Prisma migrations are applied
# 3. Database is seeded with test data
# 4. Environment files are configured
#
# Usage:
#   ./setup-local.sh [--force-reset]
#
# Options:
#   --force-reset    Force database reset even if test user exists
#   -h, --help       Show this help message
#
# After running this script, you can start development with:
#   pnpm dev

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Get the repository root (handles being called from any directory)
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

# Configuration
DB_PORT=54322
TEST_USER_ID="preview_user_001"
# Expected password hash prefix from seed.sql (first 20 chars is enough to verify)
EXPECTED_PASSWORD_PREFIX="46eb4f9cb6d62a4d8e23"
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:${DB_PORT}/postgres"

# Parse arguments
FORCE_RESET=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --force-reset)
            FORCE_RESET=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [--force-reset]"
            echo ""
            echo "Options:"
            echo "  --force-reset    Force database reset even if test user exists"
            echo "  -h, --help       Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

# Helper functions
info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1" >&2
}

header() {
    echo ""
    echo -e "${BOLD}=== $1 ===${NC}"
    echo ""
}

command_exists() {
    command -v "$1" &> /dev/null
}

os_name() {
    uname -s 2>/dev/null || echo "Unknown"
}

fail_missing_command() {
    local command_name="$1"
    local why="$2"

    error "$command_name is required ($why)"
    echo ""
    case "$command_name" in
        docker)
            echo "Install Docker Desktop or Docker Engine:"
            if [[ "$(os_name)" == "Darwin" ]]; then
                echo "  brew install --cask docker"
                echo "  open -a Docker"
            else
                echo "  https://docs.docker.com/engine/install/"
            fi
            ;;
        pnpm)
            echo "Install pnpm, then re-run: pnpm setup"
            echo "  npm install -g pnpm"
            ;;
    esac
    exit 1
}

ensure_command() {
    local command_name="$1"
    local why="$2"

    if ! command_exists "$command_name"; then
        fail_missing_command "$command_name" "$why"
    fi

    success "$command_name is installed"
}

ensure_docker_ready() {
    if ! command_exists docker; then
        fail_missing_command docker "local PostgreSQL runs in Docker"
    fi

    if docker info >/dev/null 2>&1; then
        success "Docker daemon is running"
        return 0
    fi

    error "Docker is installed but the daemon is not reachable"
    echo ""
    echo "Recovery path:"
    if [[ "$(os_name)" == "Darwin" ]]; then
        echo "  1. Start Docker Desktop"
        echo "  2. Wait until 'docker info' succeeds"
        echo "  3. Re-run: pnpm setup"
    else
        echo "  1. Start Docker Desktop or the docker service"
        echo "  2. Verify with: docker info"
        echo "  3. Re-run: pnpm setup"
    fi
    exit 1
}

# Cross-platform in-place sed helper
sed_in_place() {
    if sed --version >/dev/null 2>&1; then
        sed -i "$@"
    else
        sed -i '' "$@"
    fi
}

random_secret() {
    if command_exists openssl; then
        openssl rand -base64 32 | tr -d '\n'
    else
        python3 - <<'PY'
import secrets
print(secrets.token_urlsafe(32))
PY
    fi
}

set_env_var() {
    local file="$1"
    local key="$2"
    local value="$3"
    local escaped_value
    escaped_value=$(printf '%s' "$value" | sed 's/[\\&]/\\&/g')

    if grep -qE "^${key}=" "$file"; then
        sed_in_place "s|^${key}=.*|${key}=\"${escaped_value}\"|" "$file"
    else
        printf '\n%s="%s"\n' "$key" "$value" >> "$file"
    fi
}

populate_local_env_defaults() {
    local env_file="$1"

    local better_auth_secret="${BETTER_AUTH_SECRET:-}"
    if [[ -z "$better_auth_secret" || "$better_auth_secret" == "A_RANDOM_SECRET_STRING" ]]; then
        better_auth_secret=$(random_secret)
    fi

    set_env_var "$env_file" "PORT" "3500"
    set_env_var "$env_file" "NEXT_PUBLIC_SITE_URL" "http://localhost:3500"
    set_env_var "$env_file" "DATABASE_URL" "$DATABASE_URL"
    set_env_var "$env_file" "DATABASE_URL_UNPOOLED" "$DATABASE_URL"
    set_env_var "$env_file" "BETTER_AUTH_SECRET" "$better_auth_secret"
}

# Check if PostgreSQL is accepting connections
is_postgres_running() {
    docker compose -f "$REPO_ROOT/docker-compose.yml" ps --status running 2>/dev/null | grep -q postgres
}

wait_for_postgres() {
    local max_attempts=30
    local attempt=0
    while [[ $attempt -lt $max_attempts ]]; do
        if docker compose -f "$REPO_ROOT/docker-compose.yml" exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    return 1
}

# Check if test user exists in database
check_preview_user() {
    local mode="$1"

    POSTGRES_PORT="$DB_PORT" \
        PREVIEW_USER_ID="$TEST_USER_ID" \
        PREVIEW_USER_PASSWORD_PREFIX="$EXPECTED_PASSWORD_PREFIX" \
        pnpm --filter @repo/scripts exec node ./src/check-local-preview-user.mjs "$mode" >/dev/null 2>&1
}

test_user_exists() {
    check_preview_user exists
}

test_user_has_valid_password() {
    check_preview_user password
}

# Seed the database using the seed script
seed_database() {
    info "Seeding database..."
    DATABASE_URL="$DATABASE_URL" \
        SEED_FILE="$REPO_ROOT/packages/database/seed.sql" \
        pnpm --filter @repo/scripts exec node ./src/run-local-seed.mjs
}

# Main setup flow
main() {
    header "Local Development Setup"

    cd "$REPO_ROOT"

    # Step 1: Check prerequisites
    header "Step 1: Checking Prerequisites"

    ensure_command pnpm "package manager"
    ensure_docker_ready

    # Step 2: Ensure PostgreSQL is running
    header "Step 2: Starting PostgreSQL"

    if is_postgres_running; then
        success "PostgreSQL is already running"
    else
        info "Starting PostgreSQL via Docker Compose..."
        if docker compose -f "$REPO_ROOT/docker-compose.yml" up -d; then
            info "Waiting for PostgreSQL to be ready..."
            if wait_for_postgres; then
                success "PostgreSQL started successfully"
            else
                error "PostgreSQL failed to become ready"
                exit 1
            fi
        else
            error "Failed to start PostgreSQL"
            echo ""
            echo "Common issues:"
            echo "  - Docker is not running"
            echo "  - Port $DB_PORT is already in use"
            exit 1
        fi
    fi

    # Step 3: Apply migrations
    header "Step 3: Applying Migrations"

    info "Running Prisma migrations..."
    if DATABASE_URL="$DATABASE_URL" pnpm --filter @repo/database exec prisma migrate deploy; then
        success "Migrations applied successfully"
    else
        error "Failed to apply migrations"
        exit 1
    fi

    # Step 4: Check database seeding
    header "Step 4: Checking Database Seeding"

    if [[ "$FORCE_RESET" == "true" ]]; then
        info "Force reset requested, seeding database..."
        seed_database
        success "Database seeded successfully"
    elif test_user_exists; then
        if test_user_has_valid_password; then
            success "Test user exists with valid credentials"
            echo "  Email: test@preview.local"
            echo "  Password: TestPassword123"
        else
            warn "Test user exists but password hash is incorrect"
            info "Re-seeding database..."
            seed_database
            success "Database re-seeded successfully"
        fi
    else
        warn "Test user not found in database"
        info "Seeding database..."
        seed_database
        success "Database seeded successfully"
        echo "  Test user: test@preview.local"
        echo "  Password: TestPassword123"
    fi

    # Step 5: Check environment files
    header "Step 5: Checking Environment Files"

    local env_created=false

    if [[ -f "$REPO_ROOT/apps/web/.env.local" ]]; then
        success "apps/web/.env.local exists"
    elif [[ -f "$REPO_ROOT/apps/web/.env.local.example" ]]; then
        info "Creating apps/web/.env.local from example..."
        cp "$REPO_ROOT/apps/web/.env.local.example" "$REPO_ROOT/apps/web/.env.local"
        success "Created apps/web/.env.local"
        env_created=true
    else
        warn "apps/web/.env.local.example not found"
        echo "  You may need to create apps/web/.env.local manually"
    fi

    if [[ -f "$REPO_ROOT/apps/web/.env.local" ]]; then
        info "Populating local boot env defaults in apps/web/.env.local..."
        populate_local_env_defaults "$REPO_ROOT/apps/web/.env.local"
        success "Boot-critical local env defaults are in place"
    fi

    if [[ "$env_created" == "true" ]]; then
        echo ""
        warn "New environment files were created from examples"
        echo "  Boot-critical local values were filled automatically"
        echo "  Review optional provider keys before exercising those integrations"
    fi

    # Final summary
    header "Setup Complete!"

    echo -e "${GREEN}${BOLD}Your local development environment is ready!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Start development servers: ${BOLD}pnpm dev${NC}"
    echo "  2. Open the app: http://localhost:3500"
    echo "  3. Login with test user:"
    echo "     Email: test@preview.local"
    echo "     Password: TestPassword123"
    echo ""
    echo "Useful commands:"
    echo "  docker compose ps         - Check database status"
    echo "  docker compose down        - Stop database"
    echo "  docker compose down -v     - Stop and reset database"
    echo ""
}

main "$@"
