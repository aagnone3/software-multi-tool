#!/usr/bin/env bash
#
# Filesystem scanner: fails if any prod/preview/staging env file exists
# OUTSIDE tooling/admin/.secrets/. The threat is runtime auto-discovery —
# Next.js, dotenv, and various tools walk the tree looking for .env.* files,
# and a misplaced .env.production would be silently loaded into pnpm dev.
#
# Hard rule: prod credentials live in tooling/admin/.secrets/.env.production.
# Nothing matching that name (or its preview/staging cousins) is allowed
# anywhere else in the repo.
#
# Runs from `pnpm predev`, `pnpm prebuild`, and `pnpm admin doctor`.

set -euo pipefail

# Use the repo root (where this script's two-parents-up sits)
REPO_ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
ALLOWED_DIR="$REPO_ROOT/tooling/admin/.secrets"

# Filename patterns that must only ever appear inside ALLOWED_DIR.
# Deliberately narrow: we enforce a SINGLE canonical name for prod creds
# (.env.production). Other shapes (prod.env, production.env) are still
# blocked by .gitignore but aren't enforced here so we don't accidentally
# match unrelated files in vendored code.
PATTERNS=(
	".env.production"
	".env.preview"
	".env.staging"
)

declare -a found_outside=()

for pattern in "${PATTERNS[@]}"; do
	# -L = follow symlinks, -path prunes; we explicitly skip noisy dirs.
	while IFS= read -r -d '' file; do
		# Skip the allowed dir.
		case "$file" in
			"$ALLOWED_DIR"/*) continue ;;
		esac
		found_outside+=("$file")
	done < <(find "$REPO_ROOT" \
		\( -path "$REPO_ROOT/node_modules" -o \
		-path "$REPO_ROOT/.git" -o \
		-path "$REPO_ROOT/.worktrees" -o \
		-path "*/node_modules" -o \
		-path "*/.next" -o \
		-path "*/.turbo" -o \
		-path "*/dist" -o \
		-path "*/build" -o \
		-path "*/.content-collections" \) -prune \
		-o -type f -name "$pattern" -print0 2>/dev/null)
done

if [ "${#found_outside[@]}" -eq 0 ]; then
	exit 0
fi

cat >&2 <<EOF
❌ SECURITY: Production-shaped env file(s) found OUTSIDE tooling/admin/.secrets/:

$(printf '   %s\n' "${found_outside[@]}")

These files are dangerous in their current location: dev tools (pnpm dev,
Next.js, dotenv-loaders) auto-discover .env.* files and could load prod
credentials into a local process by accident.

Fix
  1. Move each file to tooling/admin/.secrets/ (the only place these
     filenames are permitted), OR
  2. Delete the file if it's not actually needed, OR
  3. If it's a legitimate template, rename it to .env.production.example
     and check it in.

Then re-run your command.

To audit on demand:
  pnpm admin doctor
EOF
exit 1
