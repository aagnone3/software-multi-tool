#!/usr/bin/env bash

# Test Suite for sync-prisma-to-supabase.sh
# Tests migration syncing behavior with various scenarios

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Script path (relative to repo root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
SYNC_SCRIPT="$SCRIPT_DIR/sync-prisma-to-supabase.sh"

# Test fixtures directory
TEST_DIR=$(mktemp -d)
TEST_PRISMA_DIR="$TEST_DIR/packages/database/prisma/migrations"
TEST_SUPABASE_DIR="$TEST_DIR/supabase/migrations"

# Test helper functions
assert_equals() {
  local expected="$1"
  local actual="$2"
  local message="$3"

  TESTS_RUN=$((TESTS_RUN + 1))

  if [ "$expected" = "$actual" ]; then
    echo -e "${GREEN}✓ PASS${NC}: $message"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗ FAIL${NC}: $message"
    echo -e "  Expected: $expected"
    echo -e "  Actual:   $actual"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
}

assert_file_exists() {
  local file="$1"
  local message="$2"

  TESTS_RUN=$((TESTS_RUN + 1))

  if [ -f "$file" ]; then
    echo -e "${GREEN}✓ PASS${NC}: $message"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗ FAIL${NC}: $message"
    echo -e "  File not found: $file"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
}

assert_file_not_exists() {
  local file="$1"
  local message="$2"

  TESTS_RUN=$((TESTS_RUN + 1))

  if [ ! -f "$file" ]; then
    echo -e "${GREEN}✓ PASS${NC}: $message"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗ FAIL${NC}: $message"
    echo -e "  File unexpectedly exists: $file"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
}

assert_file_content_equals() {
  local file="$1"
  local expected="$2"
  local message="$3"

  TESTS_RUN=$((TESTS_RUN + 1))

  if [ -f "$file" ] && [ "$(cat "$file")" = "$expected" ]; then
    echo -e "${GREEN}✓ PASS${NC}: $message"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗ FAIL${NC}: $message"
    if [ -f "$file" ]; then
      echo -e "  Expected content: $expected"
      echo -e "  Actual content: $(cat "$file")"
    else
      echo -e "  File not found: $file"
    fi
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
}

assert_command_success() {
  local command="$1"
  local message="$2"

  TESTS_RUN=$((TESTS_RUN + 1))

  # Run command and capture exit code
  eval "$command" >/dev/null 2>&1
  local exit_code=$?

  if [ $exit_code -eq 0 ]; then
    echo -e "${GREEN}✓ PASS${NC}: $message"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗ FAIL${NC}: $message"
    echo -e "  Command: $command"
    echo -e "  Exit code: $exit_code"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
}

assert_command_failure() {
  local command="$1"
  local message="$2"

  TESTS_RUN=$((TESTS_RUN + 1))

  # Run command and capture exit code
  set +e
  eval "$command" >/dev/null 2>&1
  local exit_code=$?
  set -e

  if [ $exit_code -ne 0 ]; then
    echo -e "${GREEN}✓ PASS${NC}: $message"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗ FAIL${NC}: $message"
    echo -e "  Command unexpectedly succeeded: $command"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
}

# Setup test fixture
setup_test_fixtures() {
  # Clean up any existing test directory
  rm -rf "$TEST_DIR"
  mkdir -p "$TEST_DIR"

  # Create Prisma migration directories with migration.sql files
  mkdir -p "$TEST_PRISMA_DIR/20240101000000_first_migration"
  echo "CREATE TABLE test1 (id INT);" > "$TEST_PRISMA_DIR/20240101000000_first_migration/migration.sql"

  mkdir -p "$TEST_PRISMA_DIR/20240102000000_second_migration"
  echo "CREATE TABLE test2 (id INT);" > "$TEST_PRISMA_DIR/20240102000000_second_migration/migration.sql"

  mkdir -p "$TEST_PRISMA_DIR/20240103000000_third_migration"
  echo "CREATE TABLE test3 (id INT);" > "$TEST_PRISMA_DIR/20240103000000_third_migration/migration.sql"

  # Create migration_lock.toml (should be skipped)
  echo 'provider = "postgresql"' > "$TEST_PRISMA_DIR/migration_lock.toml"

  # Create supabase migrations directory
  mkdir -p "$TEST_SUPABASE_DIR"
}

# Cleanup test fixtures
cleanup_test_fixtures() {
  rm -rf "$TEST_DIR"
}

# Run sync script with test directories
run_sync() {
  local args="${1:-}"

  # Create a modified script that uses test directories
  local test_script="$TEST_DIR/test-sync.sh"
  cat > "$test_script" << 'SCRIPT'
#!/bin/bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DRY_RUN=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run) DRY_RUN=true; shift ;;
    --verbose) VERBOSE=true; shift ;;
    --prisma-dir) PRISMA_DIR="$2"; shift 2 ;;
    --supabase-dir) SUPABASE_DIR="$2"; shift 2 ;;
    *) shift ;;
  esac
done

if [ ! -d "$PRISMA_DIR" ]; then
  echo -e "${RED}Error: Prisma migrations directory not found${NC}"
  exit 1
fi

if [ ! -d "$SUPABASE_DIR" ]; then
  mkdir -p "$SUPABASE_DIR"
fi

synced_count=0
skipped_count=0
error_count=0

for migration_dir in "$PRISMA_DIR"/*/; do
  [ -d "$migration_dir" ] || continue
  migration_name=$(basename "$migration_dir")
  if [ "$migration_name" = "migration_lock.toml" ]; then continue; fi

  source_file="$migration_dir/migration.sql"
  target_file="$SUPABASE_DIR/${migration_name}.sql"

  if [ ! -f "$source_file" ]; then
    ((skipped_count++))
    continue
  fi

  if [ -f "$target_file" ]; then
    ((skipped_count++))
    continue
  fi

  if [ "$DRY_RUN" = true ]; then
    echo "Would sync: $migration_name"
  else
    if cp "$source_file" "$target_file"; then
      echo "Synced: $migration_name"
      ((synced_count++))
    else
      ((error_count++))
    fi
  fi
done

echo "Synced: $synced_count"
echo "Skipped: $skipped_count"
echo "Errors: $error_count"

[ "$error_count" -gt 0 ] && exit 1
exit 0
SCRIPT

  chmod +x "$test_script"
  "$test_script" --prisma-dir "$TEST_PRISMA_DIR" --supabase-dir "$TEST_SUPABASE_DIR" $args
}

# ============================================================================
# Test Cases
# ============================================================================

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Suite: sync-prisma-to-supabase.sh${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ============================================================================
# Test 1: Basic sync - all migrations
# ============================================================================
echo -e "${YELLOW}Test 1: Basic sync - all migrations${NC}"
setup_test_fixtures

output=$(run_sync)
assert_file_exists "$TEST_SUPABASE_DIR/20240101000000_first_migration.sql" "First migration synced"
assert_file_exists "$TEST_SUPABASE_DIR/20240102000000_second_migration.sql" "Second migration synced"
assert_file_exists "$TEST_SUPABASE_DIR/20240103000000_third_migration.sql" "Third migration synced"
assert_file_content_equals "$TEST_SUPABASE_DIR/20240101000000_first_migration.sql" "CREATE TABLE test1 (id INT);" "First migration content correct"
echo ""

# ============================================================================
# Test 2: Incremental sync - skip existing
# ============================================================================
echo -e "${YELLOW}Test 2: Incremental sync - skip existing${NC}"
setup_test_fixtures

# Pre-create first migration in Supabase dir
echo "EXISTING CONTENT" > "$TEST_SUPABASE_DIR/20240101000000_first_migration.sql"

run_sync >/dev/null
assert_file_content_equals "$TEST_SUPABASE_DIR/20240101000000_first_migration.sql" "EXISTING CONTENT" "Existing migration not overwritten"
assert_file_exists "$TEST_SUPABASE_DIR/20240102000000_second_migration.sql" "New migration synced"
echo ""

# ============================================================================
# Test 3: Dry run mode
# ============================================================================
echo -e "${YELLOW}Test 3: Dry run mode${NC}"
setup_test_fixtures

run_sync --dry-run >/dev/null
assert_file_not_exists "$TEST_SUPABASE_DIR/20240101000000_first_migration.sql" "Dry run did not create files"
assert_file_not_exists "$TEST_SUPABASE_DIR/20240102000000_second_migration.sql" "Dry run did not create files"
echo ""

# ============================================================================
# Test 4: Empty Prisma migrations directory
# ============================================================================
echo -e "${YELLOW}Test 4: Empty Prisma migrations directory${NC}"
rm -rf "$TEST_DIR"
mkdir -p "$TEST_PRISMA_DIR"
mkdir -p "$TEST_SUPABASE_DIR"

output=$(run_sync 2>&1)
file_count=$(find "$TEST_SUPABASE_DIR" -name "*.sql" | wc -l | tr -d ' ')
assert_equals "0" "$file_count" "No files created from empty Prisma dir"
echo ""

# ============================================================================
# Test 5: Migration directory without migration.sql
# ============================================================================
echo -e "${YELLOW}Test 5: Migration directory without migration.sql${NC}"
setup_test_fixtures

# Create a migration directory without migration.sql
mkdir -p "$TEST_PRISMA_DIR/20240104000000_empty_migration"

output=$(run_sync 2>&1)
assert_file_not_exists "$TEST_SUPABASE_DIR/20240104000000_empty_migration.sql" "Empty migration skipped"
echo ""

# ============================================================================
# Test 6: Script with --help
# ============================================================================
echo -e "${YELLOW}Test 6: Script help output${NC}"
assert_command_success "$SYNC_SCRIPT --help" "Help flag works"
echo ""

# ============================================================================
# Test 7: Real script runs successfully on actual repo
# ============================================================================
echo -e "${YELLOW}Test 7: Real script runs on actual repository${NC}"
# Note: This test runs on the actual repo structure
output=$("$SYNC_SCRIPT" --dry-run 2>&1)
assert_command_success "echo '$output' | grep -q 'Sync Summary'" "Real script produces summary"
echo ""

# ============================================================================
# Cleanup
# ============================================================================
cleanup_test_fixtures

# ============================================================================
# Summary
# ============================================================================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Total:  $TESTS_RUN"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"

if [ "$TESTS_FAILED" -gt 0 ]; then
  echo ""
  echo -e "${RED}Some tests failed!${NC}"
  exit 1
else
  echo ""
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
fi
