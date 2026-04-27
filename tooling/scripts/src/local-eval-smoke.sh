#!/bin/bash
# local-eval-smoke.sh - Prove the README local-evaluation path works end-to-end enough to trust.
#
# What it checks:
# 1. `pnpm run setup` completes
# 2. the seeded preview user exists in local Postgres
# 3. `pnpm dev` serves the app on localhost:3500
# 4. the marketing home page and auth login page respond with expected content
#
# Usage:
#   ./local-eval-smoke.sh

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
POSTGRES_PORT="${POSTGRES_PORT:-54322}"
APP_URL="${APP_URL:-http://127.0.0.1:3500}"
TEST_USER_ID="preview_user_001"
SERVER_LOG="${TMPDIR:-/tmp}/software-multi-tool-local-eval-smoke.log"
SERVER_PID=""

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

cleanup() {
    if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" >/dev/null 2>&1; then
        info "Stopping dev server ($SERVER_PID)..."
        kill "$SERVER_PID" >/dev/null 2>&1 || true
        wait "$SERVER_PID" >/dev/null 2>&1 || true
    fi
}

os_name() {
    uname -s 2>/dev/null || echo "Unknown"
}

print_command_install_help() {
    local command_name="$1"

    case "$command_name" in
        curl)
            echo "Install curl with your system package manager, then re-run: pnpm local-eval:smoke"
            ;;
        pnpm)
            echo "Install pnpm, then re-run: pnpm local-eval:smoke"
            echo "  npm install -g pnpm"
            ;;
    esac
}

require_command() {
    local command_name="$1"
    local why="${2:-required for the local evaluation smoke check}"

    if ! command -v "$command_name" >/dev/null 2>&1; then
        error "$command_name is required ($why)"
        echo ""
        print_command_install_help "$command_name"
        exit 1
    fi
}

wait_for_http() {
    local url="$1"
    local attempts="${2:-60}"
    local delay_seconds="${3:-2}"

    for ((i = 1; i <= attempts; i++)); do
        if curl --silent --show-error --fail "$url" >/dev/null 2>&1; then
            return 0
        fi
        sleep "$delay_seconds"
    done

    return 1
}

assert_seeded_user() {
    local seeded_user
    if ! seeded_user=$(POSTGRES_PORT="$POSTGRES_PORT" \
        PREVIEW_USER_ID="$TEST_USER_ID" \
        pnpm --filter @repo/scripts exec node ./src/check-local-preview-user.mjs exists 2>&1); then
        error "Expected preview user test@preview.local for $TEST_USER_ID"
        echo "$seeded_user"
        exit 1
    fi

    if [[ "$(echo "$seeded_user" | tail -n 1 | tr -d '[:space:]')" != "test@preview.local" ]]; then
        error "Expected preview user test@preview.local for $TEST_USER_ID, got '${seeded_user:-<empty>}'"
        exit 1
    fi

    success "Seeded preview user exists in local Postgres"
}

assert_http_contains() {
    local path="$1"
    local needle="$2"
    local response

    response=$(curl --silent --show-error --fail "$APP_URL$path")
    if ! grep -Fq "$needle" <<<"$response"; then
        error "Expected $path response to contain: $needle"
        echo ""
        warn "See dev-server log: $SERVER_LOG"
        exit 1
    fi

    success "$path responded with expected content"
}

main() {
    trap cleanup EXIT

    require_command pnpm "used to run workspace setup and dev commands"
    require_command curl "used to verify the local HTTP responses"

    cd "$REPO_ROOT"

    header "Local evaluation smoke check"

    header "Step 1: Run setup"
    pnpm run setup
    success "pnpm run setup completed"

    header "Step 2: Verify seeded preview user"
    assert_seeded_user

    header "Step 3: Start the web app"
    : > "$SERVER_LOG"
    info "Writing dev server logs to $SERVER_LOG"
    pnpm --filter web run dev >"$SERVER_LOG" 2>&1 &
    SERVER_PID=$!

    if wait_for_http "$APP_URL" 90 2; then
        success "Dev server responded at $APP_URL"
    else
        error "Timed out waiting for $APP_URL"
        echo ""
        warn "See dev-server log: $SERVER_LOG"
        exit 1
    fi

    header "Step 4: Verify the advertised local success state"
    assert_http_contains "/" "your one-stop shop for ai-powered business tools"
    assert_http_contains "/auth/login" "Welcome back"

    header "Smoke check passed"
    echo -e "${GREEN}${BOLD}Local evaluation path is working.${NC}"
    echo ""
    echo "Verified:"
    echo "  - pnpm run setup completes"
    echo "  - seeded preview user exists"
    echo "  - pnpm dev serves the app at $APP_URL"
    echo "  - the marketing home page loads"
    echo "  - the login page loads"
}

main "$@"
