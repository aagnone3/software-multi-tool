#!/usr/bin/env bash

# Worktree Setup Script
# Automates the complete setup of git worktrees for parallel development
#
# Features:
# - Creates worktree with proper branch naming
# - Copies and configures environment files
# - Allocates unique ports for web app
# - Generates Prisma client
# - Runs baseline verification tests
# - Supports cleanup/removal of worktrees
# - Fail-fast: Stops on first error
# - Idempotent: Can be re-run on existing worktrees

set -euo pipefail

# Get script directory for relative paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
WORKTREE_BASE_DIR=".worktrees"
PORT_ALLOCATOR="$SCRIPT_DIR/worktree-port.sh"
REQUIRED_NODE_MAJOR="22"

# Print colored output
log_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
  echo -e "${RED}✗${NC} $1" >&2
}

log_step() {
  echo -e "\n${BOLD}=== $1 ===${NC}"
}

# Check and switch to correct Node version
ensure_node_version() {
  local current_major
  current_major=$(node --version 2>/dev/null | grep -oE '^v[0-9]+' | tr -d 'v')

  if [ "$current_major" = "$REQUIRED_NODE_MAJOR" ]; then
    log_success "Node.js v$REQUIRED_NODE_MAJOR is active"
    return 0
  fi

  log_warning "Node.js v$current_major detected, but v$REQUIRED_NODE_MAJOR is required"

  # Try to switch using nvm
  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    log_info "Attempting to switch Node version using nvm..."

    # Source nvm (needed in scripts)
    # Note: nvm sourcing can trigger non-zero exit codes with set -e, so temporarily disable
    export NVM_DIR="$HOME/.nvm"
    set +e
    # shellcheck source=/dev/null
    . "$NVM_DIR/nvm.sh"
    set -e

    # Check if v22 is installed by looking for version directory
    # Note: nvm ls can return non-zero exit codes even when version exists
    if ls "$NVM_DIR/versions/node/"v"$REQUIRED_NODE_MAJOR".* &>/dev/null; then
      nvm use "$REQUIRED_NODE_MAJOR" --silent
      log_success "Switched to Node.js v$REQUIRED_NODE_MAJOR using nvm"
      return 0
    else
      log_warning "Node.js v$REQUIRED_NODE_MAJOR not installed in nvm"
      log_info "Installing Node.js v$REQUIRED_NODE_MAJOR..."
      if nvm install "$REQUIRED_NODE_MAJOR" && nvm use "$REQUIRED_NODE_MAJOR" --silent; then
        log_success "Installed and switched to Node.js v$REQUIRED_NODE_MAJOR"
        return 0
      fi
    fi
  fi

  # Try fnm as fallback
  if command -v fnm &>/dev/null; then
    log_info "Attempting to switch Node version using fnm..."
    if fnm use "$REQUIRED_NODE_MAJOR" 2>/dev/null || fnm install "$REQUIRED_NODE_MAJOR" && fnm use "$REQUIRED_NODE_MAJOR"; then
      log_success "Switched to Node.js v$REQUIRED_NODE_MAJOR using fnm"
      return 0
    fi
  fi

  # Could not switch automatically
  log_error "Could not switch to Node.js v$REQUIRED_NODE_MAJOR automatically"
  log_error ""
  log_error "This project requires Node.js v22 LTS. Please switch manually:"
  log_error "  nvm install 22 && nvm use 22"
  log_error "  # or"
  log_error "  fnm install 22 && fnm use 22"
  log_error ""
  log_error "Current version: $(node --version)"
  return 1
}

usage() {
  cat <<EOF
${BOLD}Worktree Setup Script${NC}

Automates the complete setup of git worktrees for parallel development.

${BOLD}Usage:${NC}
  $(basename "$0") create <issue-key> <type> <description>
  $(basename "$0") remove <worktree-name>
  $(basename "$0") list
  $(basename "$0") resume <worktree-name>

${BOLD}Commands:${NC}
  create    Create a new worktree with full setup
  remove    Remove an existing worktree (with safety checks)
  list      List all active worktrees
  resume    Resume/repair setup on an existing worktree

${BOLD}Arguments for 'create':${NC}
  issue-key     Linear issue key (e.g., PRA-163, 163)
  type          Branch type: feat, fix, chore, docs, refactor, test
  description   Short description in kebab-case (e.g., improve-auth-flow)

${BOLD}Examples:${NC}
  # Create a feature worktree for PRA-163
  $(basename "$0") create PRA-163 feat worktree-setup-automation
  $(basename "$0") create 163 feat worktree-setup-automation

  # Create a bugfix worktree
  $(basename "$0") create PRA-42 fix navigation-bug

  # Remove a worktree
  $(basename "$0") remove feat-pra-163-worktree-setup-automation

  # Resume setup on existing worktree
  $(basename "$0") resume feat-pra-163-worktree-setup-automation

  # List all worktrees
  $(basename "$0") list

${BOLD}What this script automates:${NC}
  1. Creates the worktree with proper branch naming
  2. Copies environment files from parent repository
  3. Allocates unique ports for web app (3501-3999)
  4. Installs/links dependencies (pnpm install)
  5. Generates Prisma client
  6. Runs baseline verification tests
  7. Reports success/failure status

${BOLD}Fail-fast behavior:${NC}
  The script stops on the first error and reports what went wrong.
  You can re-run the script to resume from where it left off.

EOF
}

# Normalize issue key (handle both PRA-163 and 163 formats)
normalize_issue_key() {
  local key="$1"
  # If it's just a number, prepend PRA-
  if [[ "$key" =~ ^[0-9]+$ ]]; then
    echo "PRA-$key"
  else
    # Ensure uppercase (compatible with bash 3.2 on macOS)
    echo "$key" | tr '[:lower:]' '[:upper:]'
  fi
}

# Validate branch type
validate_branch_type() {
  local type="$1"
  case "$type" in
    feat|fix|chore|docs|refactor|test)
      return 0
      ;;
    *)
      log_error "Invalid branch type: $type"
      log_error "Valid types: feat, fix, chore, docs, refactor, test"
      return 1
      ;;
  esac
}

# Validate description - must be kebab-case
validate_description() {
  local desc="$1"
  # Must be lowercase letters, numbers, and hyphens only
  # Must start and end with alphanumeric character
  if [[ ! "$desc" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ ]]; then
    log_error "Invalid description: $desc"
    log_error "Description must be kebab-case (lowercase letters, numbers, hyphens only)"
    log_error "Example: improve-auth-flow, fix-login-bug, add-user-profile"
    return 1
  fi
  # Prevent excessively long descriptions
  if [ ${#desc} -gt 50 ]; then
    log_error "Description too long (max 50 characters): $desc"
    return 1
  fi
  return 0
}

# Check if we're in the repository root
check_repo_root() {
  # .git can be a directory (normal repo) or a file (worktree pointing to parent)
  if [ ! -f "$REPO_ROOT/package.json" ] || [ ! -e "$REPO_ROOT/.git" ]; then
    log_error "Not in repository root. Please run from the software-multi-tool directory."
    exit 1
  fi
}

# Check prerequisites
check_prerequisites() {
  log_step "Checking prerequisites"

  local errors=0

  # Check Node.js version FIRST (before any pnpm commands)
  if ! ensure_node_version; then
    errors=$((errors + 1))
  fi

  # Check git version
  if ! command -v git &> /dev/null; then
    log_error "git is not installed"
    errors=$((errors + 1))
  else
    local git_version
    git_version=$(git --version | grep -oE '[0-9]+\.[0-9]+' | head -1)
    log_success "git version $git_version found"
  fi

  # Check pnpm
  if ! command -v pnpm &> /dev/null; then
    log_error "pnpm is not installed"
    errors=$((errors + 1))
  else
    log_success "pnpm found"
  fi

  # Check port allocator script
  if [ ! -x "$PORT_ALLOCATOR" ]; then
    log_error "Port allocator script not found or not executable: $PORT_ALLOCATOR"
    errors=$((errors + 1))
  else
    log_success "Port allocator script found"
  fi

  # Check if .worktrees is gitignored
  cd "$REPO_ROOT"
  if ! git check-ignore -q "$WORKTREE_BASE_DIR" 2>/dev/null; then
    log_warning "$WORKTREE_BASE_DIR is not in .gitignore"
    log_info "Adding to .gitignore..."
    echo "$WORKTREE_BASE_DIR/" >> .gitignore
    log_success "Added $WORKTREE_BASE_DIR/ to .gitignore"
  else
    log_success "$WORKTREE_BASE_DIR is gitignored"
  fi

  if [ $errors -gt 0 ]; then
    log_error "Prerequisites check failed with $errors error(s)"
    exit 1
  fi
}

# Create worktree
create_worktree() {
  local issue_key="$1"
  local branch_type="$2"
  local description="$3"

  # Normalize issue key
  issue_key=$(normalize_issue_key "$issue_key")

  # Validate branch type
  validate_branch_type "$branch_type" || exit 1

  # Validate description
  validate_description "$description" || exit 1

  # Convert issue key to lowercase for directory name
  local issue_lower
  issue_lower=$(echo "$issue_key" | tr '[:upper:]' '[:lower:]')

  # Build names
  local worktree_name="${branch_type}-${issue_lower}-${description}"
  local branch_name="${branch_type}/${issue_lower}-${description}"
  local worktree_path="$REPO_ROOT/$WORKTREE_BASE_DIR/$worktree_name"

  log_info "Creating worktree for ${BOLD}$issue_key${NC}"
  log_info "  Directory: $WORKTREE_BASE_DIR/$worktree_name"
  log_info "  Branch: $branch_name"

  # Check prerequisites
  check_prerequisites

  # Step 1: Create worktree directory
  log_step "Step 1: Creating git worktree"

  cd "$REPO_ROOT"

  # Prune stale worktree references
  git worktree prune

  # Create .worktrees directory if it doesn't exist
  mkdir -p "$WORKTREE_BASE_DIR"

  # Check if worktree already exists
  if [ -d "$worktree_path" ]; then
    log_warning "Worktree directory already exists: $worktree_path"
    log_info "Running resume to complete setup..."
    resume_worktree "$worktree_name"
    return
  fi

  # Check if branch already exists
  if git show-ref --verify --quiet "refs/heads/$branch_name" 2>/dev/null; then
    log_warning "Branch $branch_name already exists"
    # Create worktree from existing branch
    git worktree add "$worktree_path" "$branch_name"
  else
    # Create worktree with new branch from main
    git worktree add "$worktree_path" -b "$branch_name" main
  fi

  log_success "Created worktree at $worktree_path"

  # Continue with setup
  setup_worktree_environment "$worktree_path"
}

# Setup worktree environment (can be called for new or existing worktrees)
setup_worktree_environment() {
  local worktree_path="$1"

  # Step 2: Copy environment files
  log_step "Step 2: Configuring environment files"

  # Web app environment
  if [ -f "$REPO_ROOT/apps/web/.env.local" ]; then
    cp "$REPO_ROOT/apps/web/.env.local" "$worktree_path/apps/web/.env.local"
    log_success "Copied apps/web/.env.local"
  else
    log_warning "No apps/web/.env.local found in parent repository"
  fi

  # Enforce Supabase Local database (NEVER use Homebrew Postgres)
  log_info "Enforcing Supabase Local database..."
  local web_env_tmp="$worktree_path/apps/web/.env.local"
  local supabase_url="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

  # Check and fix web app database URL
  if [ -f "$web_env_tmp" ]; then
    local current_web_db
    current_web_db=$(grep "^POSTGRES_PRISMA_URL=" "$web_env_tmp" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"')
    if echo "$current_web_db" | grep -q ":5432[^2]"; then
      log_warning "Homebrew Postgres detected in web app (port 5432)"
      log_info "Switching to Supabase Local (port 54322)..."
      sed -i.bak "s|^POSTGRES_PRISMA_URL=.*|POSTGRES_PRISMA_URL=\"$supabase_url\"|" "$web_env_tmp"
      sed -i.bak "s|^POSTGRES_URL_NON_POOLING=.*|POSTGRES_URL_NON_POOLING=\"$supabase_url\"|" "$web_env_tmp"
      rm -f "$web_env_tmp.bak"
      log_success "Web app database URL updated to Supabase Local"
    elif echo "$current_web_db" | grep -q ":54322"; then
      log_success "Web app already using Supabase Local"
    fi
  fi

  # Step 3: Allocate unique ports
  log_step "Step 3: Allocating unique ports"

  local web_port
  local web_env_file="$worktree_path/apps/web/.env.local"

  # Check if web port is already configured (for resume/idempotency)
  if grep -q "^PORT=" "$web_env_file" 2>/dev/null; then
    web_port=$(grep "^PORT=" "$web_env_file" | tail -1 | cut -d= -f2)
    log_info "Web port already configured: $web_port (preserving existing)"
  else
    # Allocate web port with proper error handling
    local port_output
    if ! port_output=$("$PORT_ALLOCATOR" "$worktree_path" 2>&1); then
      log_error "Failed to allocate web port: $port_output"
      exit 1
    fi
    web_port=$(echo "$port_output" | grep -E '^[0-9]+$' | head -1)
    if [ -z "$web_port" ]; then
      log_error "Port allocator did not return a valid port number"
      log_error "Output: $port_output"
      exit 1
    fi
    # Append port to env file using grouped redirect
    {
      echo ""
      echo "# Worktree-specific port (auto-allocated by worktree-setup.sh)"
      echo "PORT=$web_port"
    } >> "$web_env_file"
    log_success "Web app port allocated: $web_port"
  fi

  # Update NEXT_PUBLIC_SITE_URL
  if grep -q "^NEXT_PUBLIC_SITE_URL=" "$web_env_file"; then
    sed -i.bak "s|^NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=\"http://localhost:$web_port\"|" "$web_env_file"
    rm -f "$web_env_file.bak"
  fi

  # Step 4: Install dependencies
  log_step "Step 4: Installing dependencies"

  cd "$worktree_path"

  # Check if node_modules exists and is valid
  if [ -d "node_modules" ] && [ -f "node_modules/.pnpm/lock.yaml" ]; then
    log_info "node_modules exists, verifying..."
    if pnpm install --frozen-lockfile 2>/dev/null; then
      log_success "Dependencies verified"
    else
      log_warning "Dependencies may be outdated, running full install..."
      pnpm install
      log_success "Dependencies installed"
    fi
  else
    log_info "Installing dependencies..."
    pnpm install
    log_success "Dependencies installed"
  fi

  # Step 5: Generate Prisma client and check migrations
  log_step "Step 5: Generating Prisma client"

  if pnpm --filter @repo/database generate 2>/dev/null; then
    log_success "Prisma client generated"
  else
    log_error "Failed to generate Prisma client"
    exit 1
  fi

  # Check for pending migrations (informational only)
  log_info "Checking for pending database migrations..."
  local web_db_url
  web_db_url=$(grep "^POSTGRES_PRISMA_URL=" "$web_env_file" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"')
  if [ -n "$web_db_url" ]; then
    local migrate_status
    if migrate_status=$(POSTGRES_PRISMA_URL="$web_db_url" POSTGRES_URL_NON_POOLING="$web_db_url" \
      pnpm --filter @repo/database exec prisma migrate status 2>&1); then
      if echo "$migrate_status" | grep -q "Following migration have not yet been applied"; then
        log_warning "Pending database migrations detected!"
        echo "$migrate_status" | grep -A1 "Following migration" | tail -1 | sed 's/^/  /'
        log_info "Run: POSTGRES_PRISMA_URL=\"$web_db_url\" POSTGRES_URL_NON_POOLING=\"$web_db_url\" pnpm --filter @repo/database exec prisma migrate deploy"
      else
        log_success "Database migrations are up to date"
      fi
    fi
  fi

  # Step 6: Verify Supabase Local is running and database is seeded
  # Note: We enforce Supabase Local in Step 2, so we know we're using port 54322
  log_step "Step 6: Checking Supabase Local status"

  # Ensure Supabase local is running
  if supabase status &>/dev/null; then
    log_success "Supabase local is running"
  else
    log_warning "Supabase local is not running"
    log_info "Starting Supabase local..."
    if supabase start; then
      log_success "Supabase local started"
    else
      log_error "Failed to start Supabase local"
      log_info "Run: supabase start"
      log_info "Then: supabase db reset"
      exit 1
    fi
  fi

  # Verify test user exists with correct password hash
  log_info "Checking for test user in Supabase Local..."

  if PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -tAc "SELECT 1 FROM \"user\" WHERE id = 'preview_user_001'" 2>/dev/null | grep -q "1"; then
    # User exists, verify password hash is correct
    local password_hash
    password_hash=$(PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -tAc "SELECT password FROM account WHERE \"userId\" = 'preview_user_001'" 2>/dev/null | tr -d ' ')

    # Expected hash from seed.sql (first 20 chars)
    local expected_prefix="46eb4f9cb6d62a4d8e23"

    if echo "$password_hash" | grep -q "^$expected_prefix"; then
      log_success "Database seeded correctly (preview_user_001 exists with valid password)"
    else
      log_warning "Test user exists but password hash is incorrect"
      log_info "Resetting database with correct seed..."
      if supabase db reset --no-confirm 2>&1; then
        log_success "Database reset and seeded successfully"
      else
        log_warning "Database reset had issues (non-blocking)"
        log_info "Run manually: supabase db reset"
      fi
    fi
  else
    log_info "Test user not found, resetting database with seed..."
    if supabase db reset --no-confirm 2>&1; then
      log_success "Database reset and seeded successfully"
    else
      log_warning "Database reset had issues (non-blocking)"
      log_info "Run manually: supabase db reset"
    fi
  fi

  # Step 7: Configure Supabase Local Storage
  log_step "Step 7: Configuring Supabase Local Storage"

  # Supabase local storage requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
  # These are standard local development values for Supabase
  local supabase_local_url="http://127.0.0.1:54321"
  local supabase_service_role_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

  # Configure web app storage
  if [ -f "$web_env_file" ]; then
    if ! grep -q "^SUPABASE_URL=" "$web_env_file" 2>/dev/null; then
      {
        echo ""
        echo "# Supabase Local Storage Configuration (auto-configured by worktree-setup.sh)"
        echo "SUPABASE_URL=$supabase_local_url"
        echo "SUPABASE_SERVICE_ROLE_KEY=$supabase_service_role_key"
      } >> "$web_env_file"
      log_success "Web app Supabase storage configured"
    else
      # Update existing values to use local
      sed -i.bak "s|^SUPABASE_URL=.*|SUPABASE_URL=$supabase_local_url|" "$web_env_file"
      rm -f "$web_env_file.bak"
      if ! grep -q "^SUPABASE_SERVICE_ROLE_KEY=" "$web_env_file" 2>/dev/null; then
        echo "SUPABASE_SERVICE_ROLE_KEY=$supabase_service_role_key" >> "$web_env_file"
      fi
      log_success "Web app Supabase storage updated for local"
    fi
  fi

  # Step 8: Run baseline verification
  log_step "Step 8: Running baseline verification"

  log_info "Running type check..."
  if pnpm --filter web run type-check 2>/dev/null; then
    log_success "Type check passed"
  else
    log_warning "Type check had issues (non-blocking)"
  fi

  # Final summary
  log_step "Setup Complete!"

  echo ""
  echo -e "${GREEN}${BOLD}Worktree is ready for development!${NC}"
  echo ""
  echo -e "  ${BOLD}Directory:${NC} $worktree_path"
  echo -e "  ${BOLD}Web port:${NC} $web_port"
  echo ""
  echo -e "  ${BOLD}Next steps:${NC}"
  echo "    cd $worktree_path"
  echo "    pnpm dev"
  echo ""
}

# Resume/repair setup on existing worktree
resume_worktree() {
  local worktree_name="$1"
  local worktree_path="$REPO_ROOT/$WORKTREE_BASE_DIR/$worktree_name"

  if [ ! -d "$worktree_path" ]; then
    log_error "Worktree not found: $worktree_path"
    exit 1
  fi

  log_info "Resuming setup for worktree: $worktree_name"
  setup_worktree_environment "$worktree_path"
}

# Remove worktree with safety checks
remove_worktree() {
  local worktree_name="$1"
  local worktree_path="$REPO_ROOT/$WORKTREE_BASE_DIR/$worktree_name"

  log_info "Removing worktree: $worktree_name"

  if [ ! -d "$worktree_path" ]; then
    log_error "Worktree not found: $worktree_path"
    exit 1
  fi

  cd "$REPO_ROOT"

  # Check for uncommitted changes
  if [ -d "$worktree_path/.git" ] || [ -f "$worktree_path/.git" ]; then
    cd "$worktree_path"
    if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
      log_error "Worktree has uncommitted changes!"
      log_error "Please commit or stash changes before removing."
      log_info "Run: cd $worktree_path && git status"
      exit 1
    fi

    # Check if branch is pushed
    local branch
    branch=$(git branch --show-current)
    if ! git fetch origin "$branch" 2>/dev/null; then
      log_warning "Branch $branch not found on remote"
    elif ! git diff --quiet "origin/$branch" 2>/dev/null; then
      log_warning "Local branch has unpushed commits"
      log_info "Consider running: git push -u origin $branch"
    fi

    cd "$REPO_ROOT"
  fi

  # Remove worktree
  log_step "Removing worktree"

  git worktree remove "$worktree_path" --force
  git worktree prune

  log_success "Worktree removed: $worktree_name"

  # Optionally delete branch
  echo ""
  log_info "The branch still exists. To delete it:"
  echo "    git branch -d <branch-name>"
  echo "    git push origin --delete <branch-name>"
}

# List all worktrees
list_worktrees() {
  log_info "Active worktrees:"
  echo ""

  cd "$REPO_ROOT"
  git worktree list

  echo ""

  # Show worktrees in .worktrees directory
  if [ -d "$WORKTREE_BASE_DIR" ]; then
    log_info "Worktrees in $WORKTREE_BASE_DIR:"
    echo ""
    for dir in "$WORKTREE_BASE_DIR"/*/; do
      if [ -d "$dir" ]; then
        local name
        name=$(basename "$dir")
        local branch=""
        if [ -f "$dir/.git" ]; then
          branch=$(cd "$dir" && git branch --show-current 2>/dev/null || echo "unknown")
        fi
        echo "  - $name (branch: $branch)"
      fi
    done
  fi
}

# Main command dispatcher
main() {
  # Handle help before any other checks
  if [ $# -eq 0 ]; then
    usage
    exit 1
  fi

  local command="$1"

  # Show help without requiring repo root
  if [ "$command" = "--help" ] || [ "$command" = "-h" ] || [ "$command" = "help" ]; then
    usage
    exit 0
  fi

  # Now check repo root for all other commands
  check_repo_root

  shift

  case "$command" in
    create)
      if [ $# -lt 3 ]; then
        log_error "Missing arguments for 'create' command"
        echo ""
        usage
        exit 1
      fi
      create_worktree "$1" "$2" "$3"
      ;;
    remove)
      if [ $# -lt 1 ]; then
        log_error "Missing worktree name for 'remove' command"
        exit 1
      fi
      remove_worktree "$1"
      ;;
    resume)
      if [ $# -lt 1 ]; then
        log_error "Missing worktree name for 'resume' command"
        exit 1
      fi
      resume_worktree "$1"
      ;;
    list)
      list_worktrees
      ;;
    *)
      log_error "Unknown command: $command"
      echo ""
      usage
      exit 1
      ;;
  esac
}

# Run main
main "$@"
