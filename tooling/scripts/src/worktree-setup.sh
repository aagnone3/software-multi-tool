#!/usr/bin/env bash

# Worktree Setup Script
# Automates the complete setup of git worktrees for parallel development
#
# Features:
# - Creates worktree with proper branch naming
# - Copies and configures environment files
# - Allocates unique ports for web app and api-server
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
  3. Allocates unique ports for web app (3501-3999) and api-server (4001-4499)
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

  # API server environment
  if [ -f "$REPO_ROOT/apps/api-server/.env.local" ]; then
    cp "$REPO_ROOT/apps/api-server/.env.local" "$worktree_path/apps/api-server/.env.local"
    log_success "Copied apps/api-server/.env.local"
  fi

  # Step 3: Allocate unique ports
  log_step "Step 3: Allocating unique ports"

  local web_port
  local api_port

  # Allocate web port
  web_port=$("$PORT_ALLOCATOR" "$worktree_path" 2>/dev/null | head -1)
  echo "" >> "$worktree_path/apps/web/.env.local"
  echo "# Worktree-specific port (auto-allocated by worktree-setup.sh)" >> "$worktree_path/apps/web/.env.local"
  echo "PORT=$web_port" >> "$worktree_path/apps/web/.env.local"

  # Update NEXT_PUBLIC_SITE_URL
  if grep -q "^NEXT_PUBLIC_SITE_URL=" "$worktree_path/apps/web/.env.local"; then
    sed -i.bak "s|^NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=\"http://localhost:$web_port\"|" "$worktree_path/apps/web/.env.local"
    rm -f "$worktree_path/apps/web/.env.local.bak"
  fi

  log_success "Web app port allocated: $web_port"

  # Allocate API server port if env exists
  if [ -f "$worktree_path/apps/api-server/.env.local" ]; then
    api_port=$("$PORT_ALLOCATOR" "$worktree_path" --offset 500 2>/dev/null | head -1)
    echo "" >> "$worktree_path/apps/api-server/.env.local"
    echo "# Worktree-specific port (auto-allocated by worktree-setup.sh)" >> "$worktree_path/apps/api-server/.env.local"
    echo "PORT=$api_port" >> "$worktree_path/apps/api-server/.env.local"

    # Update CORS_ORIGIN and BETTER_AUTH_URL
    sed -i.bak "s|^CORS_ORIGIN=.*|CORS_ORIGIN=http://localhost:$web_port|" "$worktree_path/apps/api-server/.env.local"
    sed -i.bak "s|^BETTER_AUTH_URL=.*|BETTER_AUTH_URL=http://localhost:$api_port|" "$worktree_path/apps/api-server/.env.local"
    rm -f "$worktree_path/apps/api-server/.env.local.bak"

    log_success "API server port allocated: $api_port"
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

  # Step 5: Generate Prisma client
  log_step "Step 5: Generating Prisma client"

  if pnpm --filter @repo/database generate 2>/dev/null; then
    log_success "Prisma client generated"
  else
    log_error "Failed to generate Prisma client"
    exit 1
  fi

  # Step 6: Run baseline verification
  log_step "Step 6: Running baseline verification"

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
  if [ -n "${api_port:-}" ]; then
    echo -e "  ${BOLD}API port:${NC} $api_port"
  fi
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
