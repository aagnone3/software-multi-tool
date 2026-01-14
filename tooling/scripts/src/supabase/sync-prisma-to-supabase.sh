#!/bin/bash
# sync-prisma-to-supabase.sh
#
# Syncs Prisma migrations to Supabase format for preview branch validation.
#
# Background:
# - Prisma uses: migrations/TIMESTAMP_name/migration.sql
# - Supabase uses: migrations/TIMESTAMP_name.sql
#
# This script copies Prisma migrations to Supabase format, enabling
# Supabase preview branches to apply new migrations before merge.
#
# Usage:
#   ./sync-prisma-to-supabase.sh [--dry-run] [--verbose]
#
# Options:
#   --dry-run   Show what would be synced without making changes
#   --verbose   Show detailed output for each migration
#
# Exit codes:
#   0 - Success (no changes or changes applied)
#   1 - Error (invalid directory structure, etc.)

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command line arguments
DRY_RUN=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [--dry-run] [--verbose]"
      echo ""
      echo "Syncs Prisma migrations to Supabase format for preview branch validation."
      echo ""
      echo "Options:"
      echo "  --dry-run   Show what would be synced without making changes"
      echo "  --verbose   Show detailed output for each migration"
      exit 0
      ;;
    *)
      echo -e "${RED}Error: Unknown option $1${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Find repository root (works from any directory in the repo)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

# Directory paths
PRISMA_DIR="$REPO_ROOT/packages/database/prisma/migrations"
SUPABASE_DIR="$REPO_ROOT/supabase/migrations"

# Validation
if [ ! -d "$PRISMA_DIR" ]; then
  echo -e "${RED}Error: Prisma migrations directory not found at $PRISMA_DIR${NC}"
  exit 1
fi

if [ ! -d "$SUPABASE_DIR" ]; then
  echo -e "${YELLOW}Warning: Supabase migrations directory not found. Creating $SUPABASE_DIR${NC}"
  if [ "$DRY_RUN" = false ]; then
    mkdir -p "$SUPABASE_DIR"
  fi
fi

# Track sync results
synced_count=0
skipped_count=0
error_count=0

echo -e "${BLUE}Syncing Prisma migrations to Supabase format...${NC}"
echo ""

# Process each Prisma migration directory
for migration_dir in "$PRISMA_DIR"/*/; do
  # Skip if not a directory
  [ -d "$migration_dir" ] || continue

  # Get the migration name (timestamp_description)
  migration_name=$(basename "$migration_dir")

  # Skip migration_lock.toml (it's a file, not a directory, but handle edge cases)
  if [ "$migration_name" = "migration_lock.toml" ]; then
    continue
  fi

  # Source and target paths
  source_file="$migration_dir/migration.sql"
  target_file="$SUPABASE_DIR/${migration_name}.sql"

  # Check if source migration.sql exists
  if [ ! -f "$source_file" ]; then
    echo -e "${YELLOW}  ⚠ Skipped: $migration_name (no migration.sql found)${NC}"
    ((++skipped_count)) || true
    continue
  fi

  # Check if target already exists
  if [ -f "$target_file" ]; then
    if [ "$VERBOSE" = true ]; then
      echo -e "${BLUE}  ✓ Already synced: $migration_name${NC}"
    fi
    ((++skipped_count)) || true
    continue
  fi

  # Sync the migration
  if [ "$DRY_RUN" = true ]; then
    echo -e "${GREEN}  → Would sync: $migration_name${NC}"
    ((synced_count++))
  else
    if cp "$source_file" "$target_file"; then
      echo -e "${GREEN}  ✓ Synced: $migration_name${NC}"
      ((++synced_count)) || true
    else
      echo -e "${RED}  ✗ Error syncing: $migration_name${NC}"
      ((++error_count)) || true
    fi
  fi
done

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Sync Summary${NC}"
echo -e "${BLUE}========================================${NC}"

if [ "$DRY_RUN" = true ]; then
  echo -e "Mode:       ${YELLOW}Dry run (no changes made)${NC}"
  echo -e "Would sync: ${GREEN}$synced_count${NC}"
else
  echo -e "Mode:       ${GREEN}Applied${NC}"
  echo -e "Synced:     ${GREEN}$synced_count${NC}"
fi

echo -e "Skipped:    ${BLUE}$skipped_count${NC}"
echo -e "Errors:     ${RED}$error_count${NC}"

if [ "$error_count" -gt 0 ]; then
  echo ""
  echo -e "${RED}Some migrations failed to sync. Please check the errors above.${NC}"
  exit 1
fi

if [ "$synced_count" -gt 0 ]; then
  echo ""
  if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}Run without --dry-run to apply these changes.${NC}"
  else
    echo -e "${GREEN}Migrations synced successfully.${NC}"
    echo -e "${YELLOW}Remember to commit the new Supabase migration files.${NC}"
  fi
fi

exit 0
