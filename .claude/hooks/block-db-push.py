#!/usr/bin/env python3
"""
Claude Code hook to block prisma db push commands.

This hook prevents using 'prisma db push' which causes schema drift between
the database and migration history. This leads to:
- Integration test failures (Testcontainers applies migrations from scratch)
- Production deployment issues (CI/CD uses migrations, not push)
- Confusion about the source of truth for the schema

Instead, use: pnpm --filter @repo/database migrate dev --name <migration-name>
"""
import json
import re
import sys


def main():
    # Read the tool use input from stdin
    input_data = json.load(sys.stdin)

    tool_name = input_data.get("tool_name", "")
    tool_input = input_data.get("tool_input", {})
    command = tool_input.get("command", "")

    # Only check Bash tool commands
    if tool_name != "Bash":
        sys.exit(0)  # Allow other tools

    # Check for prisma db push command (various forms)
    if is_db_push_command(command):
        error_msg = """
❌ Direct schema push is not allowed.

Using 'prisma db push' causes schema drift between your database and migration history,
which breaks integration tests and can cause production issues.

Instead, use: pnpm --filter @repo/database migrate dev --name <migration-name>

This creates a migration file that keeps your database in sync with the migration history.

See .claude/skills/prisma-migrate/SKILL.md for the complete migration workflow.
""".strip()
        print(error_msg, file=sys.stderr)
        sys.exit(2)  # Exit code 2 blocks the command

    # Allow the command
    sys.exit(0)


def is_db_push_command(command: str) -> bool:
    """
    Check if the command is a prisma db push command.

    Matches various forms:
    - prisma db push
    - npx prisma db push
    - pnpm prisma db push
    - pnpm --filter @repo/database push
    - pnpm --filter database push
    - dotenv ... prisma db push
    """
    # Remove quoted strings to avoid false positives
    cleaned = remove_quoted_strings(command)

    # Pattern 1: Direct prisma db push
    if re.search(r'\bprisma\s+db\s+push\b', cleaned):
        return True

    # Pattern 2: pnpm filter with push (e.g., pnpm --filter @repo/database push)
    if re.search(r'pnpm\s+--filter\s+[^\s]+\s+push\b', cleaned):
        return True

    # Pattern 3: pnpm filter with prisma push (e.g., pnpm --filter database prisma push)
    if re.search(r'pnpm\s+--filter\s+[^\s]+\s+prisma\s+push\b', cleaned):
        return True

    return False


def remove_quoted_strings(command: str) -> str:
    """Remove single and double quoted strings from command."""
    # Remove single-quoted strings
    command = re.sub(r"'[^']*'", "", command)
    # Remove double-quoted strings
    command = re.sub(r'"[^"]*"', "", command)
    return command


if __name__ == "__main__":
    main()
