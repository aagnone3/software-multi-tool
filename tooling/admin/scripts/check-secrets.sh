#!/usr/bin/env bash
#
# Pre-commit safety net: refuses any staged file that either
#   1. has a filename matching a known credential pattern, or
#   2. contains content that looks like a real secret (Vercel env-pull
#      output, live Stripe keys, postgres URLs with embedded credentials,
#      AWS access keys, GitHub PATs).
#
# Runs against `git diff --cached`. Files-already-in-history aren't
# rechecked; this is an entry-point guard, not a forensic scanner.

set -euo pipefail

# Optional path arg (pre-commit framework passes them). If none, fall back
# to staged files.
if [ "$#" -gt 0 ]; then
	FILES=("$@")
else
	mapfile -t FILES < <(git diff --cached --name-only --diff-filter=ACMR)
fi

violations=0
report() {
	violations=$((violations + 1))
	printf "❌ %s\n" "$1" >&2
}

# ----------------------------------------------------------------------------
# 1. Filename patterns. The .gitignore catches these in normal use; this
#    guard catches "I added it with `git add -f`" and other escapes.
# ----------------------------------------------------------------------------
filename_re='(^|/)(prod|production|preview|staging)\.env$|(^|/)\.env\.(prod|production|preview|staging)(\.local)?$|(^|/)\.secrets/|(^|/)\.creds/'

for f in "${FILES[@]}"; do
	if [ ! -f "$f" ]; then continue; fi
	if [[ "$f" =~ $filename_re ]]; then
		report "Filename looks like a credential container: $f"
		report "  Credentials belong in tooling/admin/.secrets/ (gitignored)."
		report "  If this is a legitimate template file, name it *.example."
	fi
done

# ----------------------------------------------------------------------------
# 2. Content signatures. Skim staged content for known live-secret shapes.
#    Skip *.example files and the .gitignore itself (which lists patterns).
# ----------------------------------------------------------------------------
content_check() {
	local file="$1" matched=0 line
	# Use git show :file to read the *staged* content, not the working tree.
	local content
	if ! content=$(git show ":$file" 2>/dev/null); then
		return 0
	fi

	# Vercel env-pull files always start with this header.
	if grep -q "^# Created by Vercel CLI" <<<"$content"; then
		report "$file contains a Vercel-CLI-generated env file (likely a leaked \`vercel env pull\` output)."
		matched=1
	fi

	# Live Stripe keys.
	if grep -Eq 'sk_live_[A-Za-z0-9]{20,}' <<<"$content"; then
		report "$file contains a live Stripe secret key (sk_live_...)."
		matched=1
	fi
	if grep -Eq 'whsec_[A-Za-z0-9]{32,}' <<<"$content"; then
		# Allow whsec_ in example files (placeholder) since they're harmless
		# patterns; we only block when the file is NOT an example.
		case "$file" in
			*.example | *.example.* | */fixtures/* | */__fixtures__/*) ;;
			*)
				report "$file contains what looks like a Stripe webhook secret (whsec_...)."
				matched=1
				;;
		esac
	fi

	# Postgres URLs with embedded credentials. Placeholder strings like
	# YOUR_DATABASE_CONNECTION_STRING are ignored — the password field has
	# to contain at least one lowercase letter AND one digit/symbol.
	if grep -Eq 'postgres(ql)?://[A-Za-z0-9_.-]+:[^@[:space:]]{3,}@[^/[:space:]]+' <<<"$content"; then
		# But ignore the standard local dev URL.
		if ! grep -Eq 'postgres(ql)?://postgres:postgres@(127\.0\.0\.1|localhost)' <<<"$content"; then
			# Suppress on example files.
			case "$file" in
				*.example | *.example.* | */fixtures/* | */__fixtures__/* | */docs/* | *.md) ;;
				*)
					report "$file contains a Postgres URL with embedded credentials."
					matched=1
					;;
			esac
		fi
	fi

	# AWS access keys.
	if grep -Eq 'AKIA[0-9A-Z]{16}' <<<"$content"; then
		report "$file contains what looks like an AWS access key (AKIA...)."
		matched=1
	fi

	# GitHub PATs and Actions tokens.
	if grep -Eq '\bgh[ps]_[A-Za-z0-9]{30,}' <<<"$content"; then
		case "$file" in
			*.example | *.example.* | */fixtures/* | *.md) ;;
			*)
				report "$file contains what looks like a GitHub token (ghp_/ghs_)."
				matched=1
				;;
		esac
	fi

	return "$matched"
}

# Files we never want to scan (binary, lockfiles, etc.) — keep the scan fast.
should_scan() {
	case "$1" in
		*.png | *.jpg | *.jpeg | *.gif | *.webp | *.ico | *.pdf | *.woff | *.woff2 | *.ttf | *.otf | *.zip | *.tar.gz)
			return 1
			;;
		*pnpm-lock.yaml | *package-lock.json | *yarn.lock)
			return 1
			;;
	esac
	return 0
}

for f in "${FILES[@]}"; do
	if [ ! -f "$f" ]; then continue; fi
	if ! should_scan "$f"; then continue; fi
	content_check "$f" || true
done

if [ "$violations" -gt 0 ]; then
	cat >&2 <<'EOF'

Refusing to commit. If you're certain this is intentional (e.g. an example
file, fixture, or doc), name it accordingly OR unstage the file with
`git restore --staged <file>` and adjust before retrying.

To bypass for an emergency (very rarely the right call):
  git commit --no-verify ...
EOF
	exit 1
fi
