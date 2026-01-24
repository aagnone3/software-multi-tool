#!/bin/bash
# supabase-local.sh - Manage local Supabase development environment
#
# Usage:
#   ./supabase-local.sh <command>
#
# Commands:
#   check   - Verify Supabase CLI installation and version
#   start   - Start local Supabase stack (API, DB, Studio, Storage, Realtime, Inbucket)
#   stop    - Gracefully stop all local Supabase services
#   status  - Check current status and display service URLs
#   reset   - Reset database with migrations and seed data

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the repository root (handles being called from any directory)
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"

# Minimum required Supabase CLI version
MIN_VERSION="2.0.0"

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

# Compare semantic versions
# Returns 0 if version1 >= version2, 1 otherwise
version_gte() {
    local version1="$1"
    local version2="$2"

    # Remove 'v' prefix if present
    version1="${version1#v}"
    version2="${version2#v}"

    # Use sort -V for version comparison
    if [[ "$(printf '%s\n%s' "$version2" "$version1" | sort -V | head -n1)" == "$version2" ]]; then
        return 0
    else
        return 1
    fi
}

# Check Supabase CLI installation and version
cmd_check() {
    echo ""
    echo "=== Supabase CLI Check ==="
    echo ""

    # Check if supabase is installed
    if ! command -v supabase &> /dev/null; then
        error "Supabase CLI is not installed"
        echo ""
        echo "Install with:"
        echo "  brew install supabase/tap/supabase"
        echo ""
        echo "Or see: https://supabase.com/docs/guides/local-development/cli/getting-started"
        exit 1
    fi

    success "Supabase CLI is installed"

    # Get version
    local version
    version=$(supabase --version 2>/dev/null | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || echo "unknown")

    if [[ "$version" == "unknown" ]]; then
        warn "Could not determine Supabase CLI version"
    else
        echo "  Version: $version"

        # Check minimum version
        if version_gte "$version" "$MIN_VERSION"; then
            success "Version $version meets minimum requirement ($MIN_VERSION)"
        else
            warn "Version $version is below minimum recommended ($MIN_VERSION)"
            echo "  Consider upgrading: brew upgrade supabase"
        fi
    fi

    # Check for supabase config
    if [[ -f "$REPO_ROOT/supabase/config.toml" ]]; then
        success "Supabase configuration found"
        echo "  Config: supabase/config.toml"
    else
        warn "No supabase/config.toml found"
    fi

    echo ""
}

# Start local Supabase stack
cmd_start() {
    echo ""
    echo "=== Starting Supabase Local Stack ==="
    echo ""

    cd "$REPO_ROOT"

    # First verify CLI
    if ! command -v supabase &> /dev/null; then
        error "Supabase CLI is not installed. Run 'pnpm supabase:check' for installation instructions."
        exit 1
    fi

    info "Starting Supabase services..."
    echo ""

    # Start supabase with all services
    if supabase start; then
        echo ""
        success "Supabase local stack is running!"
        echo ""
        cmd_status
    else
        error "Failed to start Supabase stack"
        echo ""
        echo "Common issues:"
        echo "  - Docker is not running"
        echo "  - Port conflicts (check ports 54321-54327)"
        echo "  - Run 'supabase stop' and try again"
        exit 1
    fi
}

# Stop local Supabase stack
cmd_stop() {
    echo ""
    echo "=== Stopping Supabase Local Stack ==="
    echo ""

    cd "$REPO_ROOT"

    # Verify CLI
    if ! command -v supabase &> /dev/null; then
        error "Supabase CLI is not installed"
        exit 1
    fi

    info "Stopping Supabase services..."

    if supabase stop; then
        echo ""
        success "Supabase local stack stopped"
    else
        error "Failed to stop Supabase stack"
        echo "Try: supabase stop --no-backup"
        exit 1
    fi
}

# Check status and show URLs
cmd_status() {
    echo ""
    echo "=== Supabase Local Stack Status ==="
    echo ""

    cd "$REPO_ROOT"

    # Verify CLI
    if ! command -v supabase &> /dev/null; then
        error "Supabase CLI is not installed"
        exit 1
    fi

    # Get status - capture both stdout and stderr
    local status_output
    local exit_code=0
    status_output=$(supabase status 2>&1) || exit_code=$?

    if [[ $exit_code -ne 0 ]]; then
        # Check if the error is because services aren't running
        if echo "$status_output" | grep -qi "not running\|stopped\|no container\|no such container"; then
            warn "Supabase local stack is not running"
            echo ""
            echo "Start with: pnpm supabase:start"
            exit 0
        else
            error "Failed to get Supabase status"
            echo "$status_output"
            exit 1
        fi
    fi

    # Show status output from supabase CLI
    echo "$status_output"

    echo ""
    echo "Service URLs (from config.toml):"
    echo "  API:       http://localhost:54321"
    echo "  Database:  postgresql://postgres:postgres@localhost:54322/postgres"
    echo "  Studio:    http://localhost:54323"
    echo "  Inbucket:  http://localhost:54324"
    echo "  Analytics: http://localhost:54327"
    echo ""
}

# Reset database with migrations and seed
cmd_reset() {
    echo ""
    echo "=== Resetting Supabase Database ==="
    echo ""

    cd "$REPO_ROOT"

    # Verify CLI
    if ! command -v supabase &> /dev/null; then
        error "Supabase CLI is not installed"
        exit 1
    fi

    warn "This will drop and recreate the database, applying all migrations and seeds"
    echo ""

    info "Resetting database..."

    if supabase db reset; then
        echo ""
        success "Database reset complete"
        echo ""
        echo "Applied:"
        echo "  - All migrations from supabase/migrations/"
        echo "  - Seed data from supabase/seed.sql"
    else
        error "Failed to reset database"
        echo ""
        echo "Common issues:"
        echo "  - Supabase stack is not running (run 'pnpm supabase:start' first)"
        echo "  - Migration errors (check supabase/migrations/)"
        exit 1
    fi
}

# Show usage
show_usage() {
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  check   - Verify Supabase CLI installation and version"
    echo "  start   - Start local Supabase stack"
    echo "  stop    - Stop local Supabase stack"
    echo "  status  - Check current status and display service URLs"
    echo "  reset   - Reset database with migrations and seed data"
    echo ""
    echo "Examples:"
    echo "  $0 check    # Verify CLI is properly installed"
    echo "  $0 start    # Start all local Supabase services"
    echo "  $0 status   # Check what's running and get URLs"
    echo "  $0 reset    # Reset database to clean state"
}

# Main entry point
main() {
    local command="${1:-}"

    case "$command" in
        check)
            cmd_check
            ;;
        start)
            cmd_start
            ;;
        stop)
            cmd_stop
            ;;
        status)
            cmd_status
            ;;
        reset)
            cmd_reset
            ;;
        -h|--help|help)
            show_usage
            exit 0
            ;;
        "")
            error "No command specified"
            echo ""
            show_usage
            exit 1
            ;;
        *)
            error "Unknown command: $command"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

main "$@"
