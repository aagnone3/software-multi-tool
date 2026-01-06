#!/usr/bin/env bash

# Worktree Port Allocator
# Generates a deterministic port number for a git worktree based on its path
# Checks availability and finds next free port if collision occurs

set -euo pipefail

# Configuration
PORT_MIN=3501
PORT_MAX=3999
PORT_RANGE=$((PORT_MAX - PORT_MIN + 1))

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

usage() {
  cat <<EOF
Usage: $(basename "$0") <worktree-path> [--check-only]

Generate and allocate a deterministic port for a git worktree.

Arguments:
  worktree-path   Path to the worktree directory (e.g., .worktrees/feat-pra-35-auth)
  --check-only    Only check if port is available, don't allocate

Examples:
  # Allocate port for worktree
  $(basename "$0") .worktrees/feat-pra-35-auth

  # Check if port is available
  $(basename "$0") .worktrees/feat-pra-35-auth --check-only

Output:
  Prints the allocated port number to stdout
  Returns 0 on success, 1 on error

Port Range: $PORT_MIN-$PORT_MAX ($PORT_RANGE ports available)
EOF
}

# Check if port is available
is_port_available() {
  local port=$1

  # Check if port is in use using lsof
  # -i :PORT checks internet connections on that port
  # -t returns PIDs only (faster)
  # Redirect stderr to /dev/null to avoid "command not found" on some systems
  if lsof -i ":$port" -t >/dev/null 2>&1; then
    return 1 # Port is in use
  else
    return 0 # Port is available
  fi
}

# Generate deterministic port from worktree path
# Uses SHA-256 hash of the path, maps to port range
generate_port_from_path() {
  local worktree_path=$1

  # Get absolute path to ensure consistency
  local abs_path
  abs_path=$(cd "$(dirname "$worktree_path")" && pwd)/$(basename "$worktree_path")

  # Hash the absolute path using SHA-256
  # Take first 8 characters of hex, convert to decimal
  local hash_hex
  hash_hex=$(echo -n "$abs_path" | shasum -a 256 | head -c 8)

  # Convert hex to decimal
  local hash_dec
  hash_dec=$((16#$hash_hex))

  # Map to port range using modulo
  local port_offset=$((hash_dec % PORT_RANGE))
  local port=$((PORT_MIN + port_offset))

  echo "$port"
}

# Find next available port starting from given port
find_available_port() {
  local start_port=$1
  local max_attempts=$PORT_RANGE
  local current_port=$start_port
  local attempts=0

  while [ $attempts -lt $max_attempts ]; do
    if is_port_available "$current_port"; then
      echo "$current_port"
      return 0
    fi

    # Increment port, wrap around if needed
    current_port=$((current_port + 1))
    if [ $current_port -gt $PORT_MAX ]; then
      current_port=$PORT_MIN
    fi

    attempts=$((attempts + 1))
  done

  # No available ports found
  echo "ERROR: No available ports in range $PORT_MIN-$PORT_MAX" >&2
  return 1
}

# Main function
main() {
  local worktree_path=""
  local check_only=false

  # Parse arguments
  while [ $# -gt 0 ]; do
    case "$1" in
      --check-only)
        check_only=true
        shift
        ;;
      --help|-h)
        usage
        exit 0
        ;;
      *)
        if [ -z "$worktree_path" ]; then
          worktree_path="$1"
        else
          echo "ERROR: Unknown argument: $1" >&2
          usage
        fi
        shift
        ;;
    esac
  done

  # Validate arguments
  if [ -z "$worktree_path" ]; then
    echo "ERROR: worktree-path is required" >&2
    usage
    exit 1
  fi

  # Verify worktree path exists or is valid
  if [ ! -e "$worktree_path" ] && [ ! -d "$(dirname "$worktree_path")" ]; then
    echo "ERROR: Invalid worktree path: $worktree_path" >&2
    echo "       Parent directory does not exist" >&2
    exit 1
  fi

  # Generate deterministic port
  local initial_port
  initial_port=$(generate_port_from_path "$worktree_path")

  if [ "$check_only" = true ]; then
    # Only check if initial port is available
    if is_port_available "$initial_port"; then
      echo "$initial_port"
      echo -e "${GREEN}✓ Port $initial_port is available${NC}" >&2
      exit 0
    else
      echo -e "${YELLOW}⚠ Port $initial_port is in use${NC}" >&2
      exit 1
    fi
  fi

  # Find available port starting from initial port
  local allocated_port
  if ! allocated_port=$(find_available_port "$initial_port"); then
    exit 1
  fi

  # Output port number (for scripting)
  echo "$allocated_port"

  # Log to stderr for visibility
  if [ "$allocated_port" = "$initial_port" ]; then
    echo -e "${GREEN}✓ Allocated port $allocated_port (deterministic match)${NC}" >&2
  else
    echo -e "${YELLOW}⚠ Port $initial_port was taken, allocated $allocated_port instead${NC}" >&2
  fi

  return 0
}

# Run main function
main "$@"
