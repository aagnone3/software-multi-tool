#!/usr/bin/env bash
#
# Claude Code hook to ensure the correct GitHub user (aagnone3) is active
# for gh CLI commands that require write permissions.
#
# This hook runs before Bash commands and:
# 1. Detects gh commands that require elevated permissions
# 2. Checks if the correct user is authenticated
# 3. Switches to aagnone3 if needed
#
# Exit codes:
#   0 = Allow command to proceed
#   2 = Block command (with error message)

set -e

# Read JSON input from stdin
INPUT=$(cat)

# Extract the command from the JSON
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# List of gh subcommands that require write permissions
WRITE_COMMANDS="merge|close|create|delete|edit|comment|review|approve|request-changes|ready|reopen|lock|unlock|transfer|archive"

# Check if this is a gh command that needs write access
if echo "$COMMAND" | grep -qE "^gh\s+(pr|issue|repo|release)\s+($WRITE_COMMANDS)"; then
    # Get current authenticated user
    CURRENT_USER=$(gh api user --jq '.login' 2>/dev/null || echo "")

    if [ "$CURRENT_USER" != "aagnone3" ]; then
        # Switch to aagnone3
        if gh auth switch --user aagnone3 2>/dev/null; then
            echo "Switched GitHub CLI to user: aagnone3" >&2
        else
            # If switch fails, try to find and activate the account
            if gh auth status --hostname github.com 2>&1 | grep -q "aagnone3"; then
                gh auth switch --user aagnone3 2>/dev/null || true
                echo "Switched GitHub CLI to user: aagnone3" >&2
            else
                echo "Warning: Could not switch to aagnone3. Current user: $CURRENT_USER" >&2
            fi
        fi
    fi
fi

# Allow the command to proceed
exit 0
