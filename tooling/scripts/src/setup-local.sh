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
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"

# Configuration
SUPABASE_DB_PORT=54322
TEST_USER_ID="preview_user_001"
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

# Check if Supabase is running
is_supabase_running() {
    local status_output
    status_output=$(supabase status 2>&1) || true

    # Check if the output indicates services are running
    if echo "$status_output" | grep -qi "API URL"; then
        return 0
    else
        return 1
    fi
}

# Check if test user exists in database
test_user_exists() {
    PGPASSWORD=postgres psql -h 127.0.0.1 -p "$SUPABASE_DB_PORT" -U postgres -d postgres \
        -tAc "SELECT 1 FROM \"user\" WHERE id = '$TEST_USER_ID'" 2>/dev/null | grep -q "1"
}

# Check if test user has correct password hash
test_user_has_valid_password() {
    local password_hash
    password_hash=$(PGPASSWORD=postgres psql -h 127.0.0.1 -p "$SUPABASE_DB_PORT" -U postgres -d postgres \
        -tAc "SELECT password FROM account WHERE \"userId\" = '$TEST_USER_ID'" 2>/dev/null | tr -d ' ')

    echo "$password_hash" | grep -q "^$EXPECTED_PASSWORD_PREFIX"
}

# Main setup flow
main() {
    header "Local Development Setup"

    cd "$REPO_ROOT"

    # Step 1: Check prerequisites
    header "Step 1: Checking Prerequisites"

    if ! command_exists supabase; then
        error "Supabase CLI is not installed"
        echo ""
        echo "Install with:"
        echo "  brew install supabase/tap/supabase"
        echo ""
        echo "Or see: https://supabase.com/docs/guides/local-development/cli/getting-started"
        exit 1
    fi
    success "Supabase CLI is installed"

    if ! command_exists psql; then
        error "PostgreSQL client (psql) is not installed"
        echo ""
        echo "Install with:"
        echo "  brew install postgresql"
        exit 1
    fi
    success "PostgreSQL client (psql) is installed"

    # Step 2: Ensure Supabase is running
    header "Step 2: Checking Supabase Status"

    if is_supabase_running; then
        success "Supabase is already running"
    else
        info "Starting Supabase..."
        if supabase start; then
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
        if supabase db reset; then
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
            if supabase db reset; then
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
        if supabase db reset; then
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

    # Check apps/api-server/.env.local
    if [[ -f "$REPO_ROOT/apps/api-server/.env.local" ]]; then
        success "apps/api-server/.env.local exists"
    elif [[ -f "$REPO_ROOT/apps/api-server/.env.local.example" ]]; then
        info "Creating apps/api-server/.env.local from example..."
        cp "$REPO_ROOT/apps/api-server/.env.local.example" "$REPO_ROOT/apps/api-server/.env.local"
        success "Created apps/api-server/.env.local"
        env_created=true
    else
        # api-server may not have an example file, which is fine
        if [[ ! -f "$REPO_ROOT/apps/api-server/.env.local" ]]; then
            info "apps/api-server/.env.local not found (may not be required)"
        fi
    fi

    if [[ "$env_created" == "true" ]]; then
        echo ""
        warn "New environment files were created from examples"
        echo "  Review and update them with your API keys and secrets"
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
