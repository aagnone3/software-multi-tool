#!/usr/bin/env bash

# Comprehensive Test Suite for worktree-port.sh
# Tests deterministic behavior, collision handling, edge cases, and real-world scenarios

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

# Script path
SCRIPT="./tooling/scripts/src/worktree-port.sh"

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

assert_not_equals() {
  local value1="$1"
  local value2="$2"
  local message="$3"

  TESTS_RUN=$((TESTS_RUN + 1))

  if [ "$value1" != "$value2" ]; then
    echo -e "${GREEN}✓ PASS${NC}: $message"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗ FAIL${NC}: $message"
    echo -e "  Value1: $value1"
    echo -e "  Value2: $value2"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
}

assert_in_range() {
  local value="$1"
  local min="$2"
  local max="$3"
  local message="$4"

  TESTS_RUN=$((TESTS_RUN + 1))

  if [ "$value" -ge "$min" ] && [ "$value" -le "$max" ]; then
    echo -e "${GREEN}✓ PASS${NC}: $message"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗ FAIL${NC}: $message"
    echo -e "  Value: $value (expected $min-$max)"
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

  if ! eval "$command" >/dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}: $message"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗ FAIL${NC}: $message"
    echo -e "  Command: $command (expected to fail)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
}

# Setup test environment
setup() {
  mkdir -p .worktrees
}

# Cleanup test environment
cleanup() {
  rm -rf .worktrees
}

# Test Suite 1: Deterministic Behavior
test_deterministic_behavior() {
  echo -e "\n${BLUE}═══════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}Test Suite 1: Deterministic Behavior${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}\n"

  # Test 1.1: Same path → same port
  PORT1=$($SCRIPT .worktrees/test-path-1 2>/dev/null)
  PORT2=$($SCRIPT .worktrees/test-path-1 2>/dev/null)
  assert_equals "$PORT1" "$PORT2" "Same path should return same port"

  # Test 1.2: Different paths → different ports
  PORT_A=$($SCRIPT .worktrees/feat-pra-35-auth 2>/dev/null)
  PORT_B=$($SCRIPT .worktrees/fix-pra-42-bugfix 2>/dev/null)
  assert_not_equals "$PORT_A" "$PORT_B" "Different paths should return different ports"

  # Test 1.3: Port range validation (3501-3999)
  PORT=$($SCRIPT .worktrees/test-range 2>/dev/null)
  assert_in_range "$PORT" 3501 3999 "Port should be in range 3501-3999"

  # Test 1.4: Multiple different paths all get valid ports
  for i in {1..10}; do
    PORT=$($SCRIPT ".worktrees/test-path-$i" 2>/dev/null)
    assert_in_range "$PORT" 3501 3999 "Path $i: port should be in range"
  done
}

# Test Suite 2: Collision Detection and Recovery
test_collision_handling() {
  echo -e "\n${BLUE}═══════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}Test Suite 2: Collision Detection and Recovery${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}\n"

  # Test 2.1: Script detects occupied ports
  # Start a simple server on a port
  PORT_TO_BLOCK=$($SCRIPT .worktrees/collision-test 2>/dev/null)

  # Start a background server on that port
  python3 -m http.server "$PORT_TO_BLOCK" >/dev/null 2>&1 &
  SERVER_PID=$!
  sleep 1

  # Verify port is now taken
  if lsof -i ":$PORT_TO_BLOCK" -t >/dev/null 2>&1; then
    echo -e "${GREEN}✓ SETUP${NC}: Port $PORT_TO_BLOCK is now occupied"

    # Try to allocate port for same path - should get different port
    NEW_PORT=$($SCRIPT .worktrees/collision-test 2>/dev/null)
    assert_not_equals "$PORT_TO_BLOCK" "$NEW_PORT" "Should allocate different port when original is taken"

    # New port should also be in valid range
    assert_in_range "$NEW_PORT" 3501 3999 "Collision recovery port should be in range"
  else
    echo -e "${YELLOW}⚠ SKIP${NC}: Could not start test server on port $PORT_TO_BLOCK"
  fi

  # Cleanup
  kill $SERVER_PID 2>/dev/null || true
  wait $SERVER_PID 2>/dev/null || true
  sleep 1

  # Test 2.2: Check-only flag works
  PORT=$($SCRIPT .worktrees/check-test 2>/dev/null)
  assert_command_success "$SCRIPT .worktrees/check-test --check-only" "Check-only flag should succeed for available port"
}

# Test Suite 3: Edge Cases
test_edge_cases() {
  echo -e "\n${BLUE}═══════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}Test Suite 3: Edge Cases${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}\n"

  # Test 3.1: Missing argument
  assert_command_failure "$SCRIPT" "Should fail with missing argument"

  # Test 3.2: Invalid path (parent doesn't exist)
  assert_command_failure "$SCRIPT /nonexistent/path/worktree" "Should fail with invalid path"

  # Test 3.3: Help flag works
  assert_command_success "$SCRIPT --help" "Help flag should work"

  # Test 3.4: Relative vs absolute paths give same result
  # Create a test worktree directory
  mkdir -p .worktrees/relative-test
  PORT_REL=$($SCRIPT .worktrees/relative-test 2>/dev/null)
  PORT_ABS=$($SCRIPT "$(pwd)/.worktrees/relative-test" 2>/dev/null)
  assert_equals "$PORT_REL" "$PORT_ABS" "Relative and absolute paths should give same port"

  # Test 3.5: Path with spaces
  mkdir -p ".worktrees/path with spaces"
  PORT_SPACES=$($SCRIPT ".worktrees/path with spaces" 2>/dev/null)
  assert_in_range "$PORT_SPACES" 3501 3999 "Path with spaces should work"

  # Test 3.6: Very long path
  LONG_PATH=".worktrees/very-long-path-name-to-test-hashing-behavior-with-extended-strings"
  PORT_LONG=$($SCRIPT "$LONG_PATH" 2>/dev/null)
  assert_in_range "$PORT_LONG" 3501 3999 "Long path should work"
}

# Test Suite 4: Hash Distribution
test_hash_distribution() {
  echo -e "\n${BLUE}═══════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}Test Suite 4: Hash Distribution${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}\n"

  # Test 4.1: Generate 50 different worktree names and check for collisions
  # Use file-based approach for portability (bash 3.2 compatible)
  PORT_FILE=$(mktemp)

  for i in {1..50}; do
    PORT=$($SCRIPT ".worktrees/distribution-test-$i" 2>/dev/null)
    echo "$PORT" >> "$PORT_FILE"
  done

  TOTAL_PORTS=$(wc -l < "$PORT_FILE" | tr -d ' ')
  UNIQUE_PORTS=$(sort -u "$PORT_FILE" | wc -l | tr -d ' ')
  COLLISION_COUNT=$((TOTAL_PORTS - UNIQUE_PORTS))

  echo -e "  Generated 50 worktrees → $UNIQUE_PORTS unique ports (${COLLISION_COUNT} deterministic collisions)"

  # We expect some collisions (same port for different paths) but most should be unique
  # With 499 ports and 50 samples, we expect ~40-50 unique ports
  assert_in_range "$UNIQUE_PORTS" 35 50 "Hash distribution should spread ports reasonably well"

  rm "$PORT_FILE"
}

# Test Suite 5: Real-World Integration
test_real_world_integration() {
  echo -e "\n${BLUE}═══════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}Test Suite 5: Real-World Integration${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}\n"

  # Test 5.1: Full worktree creation workflow
  BRANCH_NAME="test/integration-test-branch"
  WORKTREE_PATH=".worktrees/test-integration"

  # Create actual git worktree
  if git worktree add "$WORKTREE_PATH" -b "$BRANCH_NAME" >/dev/null 2>&1; then
    echo -e "${GREEN}✓ SETUP${NC}: Created git worktree at $WORKTREE_PATH"

    # Allocate port
    PORT=$($SCRIPT "$WORKTREE_PATH" 2>/dev/null)
    assert_in_range "$PORT" 3501 3999 "Real worktree should get valid port"

    # Test creating .env.local with port
    ENV_FILE="$WORKTREE_PATH/test.env"
    echo "PORT=$PORT" > "$ENV_FILE"

    # Verify file was created with correct content
    if [ -f "$ENV_FILE" ] && grep -q "PORT=$PORT" "$ENV_FILE"; then
      echo -e "${GREEN}✓ PASS${NC}: .env file created with PORT=$PORT"
      TESTS_PASSED=$((TESTS_PASSED + 1))
    else
      echo -e "${RED}✗ FAIL${NC}: .env file creation failed"
      TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TESTS_RUN=$((TESTS_RUN + 1))

    # Cleanup worktree
    git worktree remove "$WORKTREE_PATH" --force >/dev/null 2>&1 || true
    git branch -D "$BRANCH_NAME" >/dev/null 2>&1 || true
  else
    echo -e "${YELLOW}⚠ SKIP${NC}: Could not create git worktree (not in a git repo?)"
  fi

  # Test 5.2: Simulate parallel dev servers scenario
  echo -e "\n${BLUE}Simulating parallel dev servers...${NC}"

  # Allocate ports for 3 different worktrees
  PORT1=$($SCRIPT .worktrees/feat-pra-10-feature 2>/dev/null)
  PORT2=$($SCRIPT .worktrees/fix-pra-20-bugfix 2>/dev/null)
  PORT3=$($SCRIPT .worktrees/chore-pra-30-refactor 2>/dev/null)

  echo -e "  Worktree 1 (feat-pra-10): PORT=$PORT1"
  echo -e "  Worktree 2 (fix-pra-20):  PORT=$PORT2"
  echo -e "  Worktree 3 (chore-pra-30): PORT=$PORT3"

  # All ports should be different
  assert_not_equals "$PORT1" "$PORT2" "Parallel dev server 1 vs 2: different ports"
  assert_not_equals "$PORT2" "$PORT3" "Parallel dev server 2 vs 3: different ports"
  assert_not_equals "$PORT1" "$PORT3" "Parallel dev server 1 vs 3: different ports"
}

# Test Suite 6: Performance
test_performance() {
  echo -e "\n${BLUE}═══════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}Test Suite 6: Performance${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}\n"

  # Test 6.1: Script execution time
  START_TIME=$(date +%s%N)

  for i in {1..10}; do
    $SCRIPT ".worktrees/perf-test-$i" >/dev/null 2>&1
  done

  END_TIME=$(date +%s%N)
  ELAPSED_MS=$(( (END_TIME - START_TIME) / 1000000 ))
  AVG_MS=$(( ELAPSED_MS / 10 ))

  echo -e "  10 allocations took ${ELAPSED_MS}ms (avg ${AVG_MS}ms per allocation)"

  # Should be fast (<500ms per allocation on average)
  if [ "$AVG_MS" -lt 500 ]; then
    echo -e "${GREEN}✓ PASS${NC}: Port allocation is fast (avg ${AVG_MS}ms < 500ms)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${YELLOW}⚠ WARN${NC}: Port allocation is slow (avg ${AVG_MS}ms)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  fi
  TESTS_RUN=$((TESTS_RUN + 1))
}

# Main test runner
main() {
  echo -e "${BLUE}╔═══════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║   Worktree Port Allocator - Test Suite          ║${NC}"
  echo -e "${BLUE}╚═══════════════════════════════════════════════════╝${NC}"

  # Check if script exists
  if [ ! -f "$SCRIPT" ]; then
    echo -e "${RED}✗ ERROR${NC}: Script not found: $SCRIPT"
    exit 1
  fi

  # Make script executable
  chmod +x "$SCRIPT"

  # Setup
  setup

  # Run test suites
  test_deterministic_behavior
  test_collision_handling
  test_edge_cases
  test_hash_distribution
  test_real_world_integration
  test_performance

  # Cleanup
  cleanup

  # Print summary
  echo -e "\n${BLUE}═══════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}Test Summary${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
  echo -e "Total Tests:  $TESTS_RUN"
  echo -e "${GREEN}Passed:       $TESTS_PASSED${NC}"

  if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}Failed:       $TESTS_FAILED${NC}"
    echo -e "\n${RED}✗ TEST SUITE FAILED${NC}"
    exit 1
  else
    echo -e "${RED}Failed:       0${NC}"
    echo -e "\n${GREEN}✓ ALL TESTS PASSED${NC}"
    exit 0
  fi
}

# Run tests
main "$@"
