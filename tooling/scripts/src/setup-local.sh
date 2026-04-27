#!/bin/bash
# setup-local.sh - Unified local development environment setup
#
# This script ensures all prerequisites are in place for local development:
# 1. Supabase is running
# 2. Database is seeded with test data (test user exists)
# 3. Environment files are configured
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
SUPABASE_DB_PORT=54322
TEST_USER_ID="preview_user_001"
SUPABASE_CLI_RUNNER="$REPO_ROOT/tooling/scripts/src/supabase/run-supabase-cli.sh"
# Expected password hash prefix from seed.sql (first 20 chars is enough to verify)
EXPECTED_PASSWORD_PREFIX="46eb4f9cb6d62a4d8e23"

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

# Check if a command exists
command_exists() {
    command -v "$1" &> /dev/null
}

os_name() {
    uname -s 2>/dev/null || echo "Unknown"
}

print_command_install_help() {
    local command_name="$1"

    case "$command_name" in
        supabase)
            echo "Optional: install globally for faster cold starts, or let the repo bootstrap a pinned CLI via pnpm dlx."
            if [[ "$(os_name)" == "Darwin" ]]; then
                echo "  brew install supabase/tap/supabase"
            else
                echo "  brew install supabase/tap/supabase"
                echo "  npm install -g supabase"
            fi
            echo "  Repo-owned fallback: pnpm run setup (will use pnpm dlx supabase@\$SUPABASE_CLI_VERSION when needed)"
            echo "  Docs: https://supabase.com/docs/guides/local-development/cli/getting-started"
            ;;
        docker)
            echo "Install Docker Desktop or Docker Engine, then make sure the daemon is running:"
            if [[ "$(os_name)" == "Darwin" ]]; then
                echo "  brew install --cask docker"
                echo "  open -a Docker"
            else
                echo "  https://docs.docker.com/engine/install/"
                echo "  After install, start Docker Desktop or your system docker service"
            fi
            ;;
        pnpm)
            echo "Install pnpm, then re-run: pnpm setup"
            echo "  npm install -g pnpm"
            ;;
    esac
}

fail_missing_command() {
    local command_name="$1"
    local why="$2"

    error "$command_name is required ($why)"
    echo ""
    print_command_install_help "$command_name"
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
        fail_missing_command docker "Supabase local services run in Docker"
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
        echo "  1. Start Docker Desktop or the docker service on this machine"
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

# Generate a random secret for local auth when one is still unset
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

# Upsert or replace a quoted env var inside an env file
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

# Populate the minimum local boot env so pnpm dev works without guesswork
populate_local_env_defaults() {
    local env_file="$1"
    local local_anon_key="${SUPABASE_LOCAL_ANON_KEY:-${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}}"

    if [[ -z "$local_anon_key" ]]; then
        local_anon_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
    fi

    local better_auth_secret="${BETTER_AUTH_SECRET:-}"
    if [[ -z "$better_auth_secret" || "$better_auth_secret" == "A_RANDOM_SECRET_STRING" ]]; then
        better_auth_secret=$(random_secret)
    fi

    set_env_var "$env_file" "PORT" "3500"
    set_env_var "$env_file" "NEXT_PUBLIC_SITE_URL" "http://localhost:3500"
    set_env_var "$env_file" "DATABASE_URL" "postgresql://postgres:postgres@127.0.0.1:${SUPABASE_DB_PORT}/postgres"
    set_env_var "$env_file" "DATABASE_URL_UNPOOLED" "postgresql://postgres:postgres@127.0.0.1:${SUPABASE_DB_PORT}/postgres"
    set_env_var "$env_file" "NEXT_PUBLIC_SUPABASE_URL" "http://127.0.0.1:54321"
    set_env_var "$env_file" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$local_anon_key"
    set_env_var "$env_file" "BETTER_AUTH_SECRET" "$better_auth_secret"
}

run_supabase_cli() {
    "$SUPABASE_CLI_RUNNER" "$@"
}

# Check if Supabase is running
is_supabase_running() {
    local status_output
    status_output=$(run_supabase_cli status 2>&1) || true

    # Check if the output indicates services are running
    if echo "$status_output" | grep -qi "API URL"; then
        return 0
    else
        return 1
    fi
}

# Check if test user exists in database
check_preview_user() {
    local mode="$1"

    SUPABASE_DB_PORT="$SUPABASE_DB_PORT" \
        PREVIEW_USER_ID="$TEST_USER_ID" \
        PREVIEW_USER_PASSWORD_PREFIX="$EXPECTED_PASSWORD_PREFIX" \
        pnpm --filter @repo/scripts exec node ./src/check-local-preview-user.mjs "$mode" >/dev/null 2>&1
}

test_user_exists() {
    check_preview_user exists
}

# Check if test user has correct password hash
test_user_has_valid_password() {
    check_preview_user password
}

# Main setup flow
main() {
    header "Local Development Setup"

    cd "$REPO_ROOT"

    # Step 1: Check prerequisites
    header "Step 1: Checking Prerequisites"

    ensure_command pnpm "used to run the repo-owned preview-user validation checks and Supabase CLI fallback"
    ensure_docker_ready

    if command_exists supabase; then
        success "supabase is installed"
    else
        warn "supabase is not installed; setup will use the repo-owned pnpm dlx fallback"
    fi

    # Step 2: Ensure Supabase is running
    header "Step 2: Checking Supabase Status"

    if is_supabase_running; then
        success "Supabase is already running"
    else
        info "Starting Supabase..."
        if run_supabase_cli start; then
            success "Supabase started successfully"
        else
            error "Failed to start Supabase"
            echo ""
            echo "Common issues:"
            echo "  - Docker is not running"
            echo "  - Port conflicts (check ports 54321-54327)"
            exit 1
        fi
    fi

    # Step 3: Check database seeding
    header "Step 3: Checking Database Seeding"

    if [[ "$FORCE_RESET" == "true" ]]; then
        info "Force reset requested, resetting database..."
        if run_supabase_cli db reset; then
            success "Database reset and seeded successfully"
        else
            error "Failed to reset database"
            exit 1
        fi
    elif test_user_exists; then
        if test_user_has_valid_password; then
            success "Test user exists with valid credentials"
            echo "  Email: test@preview.local"
            echo "  Password: TestPassword123"
        else
            warn "Test user exists but password hash is incorrect"
            info "Resetting database to fix credentials..."
            if run_supabase_cli db reset; then
                success "Database reset and seeded successfully"
            else
                error "Failed to reset database"
                exit 1
            fi
        fi
    else
        warn "Test user not found in database"
        info "Database needs seeding. Running 'supabase db reset'..."
        echo ""
        if run_supabase_cli db reset; then
            success "Database seeded successfully"
            echo "  Test user: test@preview.local"
            echo "  Password: TestPassword123"
        else
            error "Failed to seed database"
            exit 1
        fi
    fi

    # Step 4: Check environment files
    header "Step 4: Checking Environment Files"

    local env_created=false

    # Check apps/web/.env.local
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
    echo "  pnpm supabase:status   - Check Supabase status"
    echo "  pnpm supabase:reset    - Reset database with fresh seed data"
    echo "  pnpm supabase:stop     - Stop Supabase services"
    echo ""
}

main "$@"
