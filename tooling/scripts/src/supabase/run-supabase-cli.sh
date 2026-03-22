#!/bin/bash
# run-supabase-cli.sh - Run the Supabase CLI from a local install or a pinned pnpm dlx fallback.

set -euo pipefail

SUPABASE_CLI_VERSION="${SUPABASE_CLI_VERSION:-2.81.2}"

if command -v supabase >/dev/null 2>&1; then
    exec supabase "$@"
fi

if ! command -v pnpm >/dev/null 2>&1; then
    echo "Supabase CLI is not installed and pnpm is unavailable for the repo-owned fallback." >&2
    echo "Install pnpm or install Supabase CLI globally, then retry." >&2
    exit 1
fi

exec pnpm dlx "supabase@${SUPABASE_CLI_VERSION}" "$@"
