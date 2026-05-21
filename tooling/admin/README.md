# @repo/admin

Operational CLI for ad-hoc administration tasks (database queries, env
inspection) across environments.

## Why this exists

The web app's `apps/web/.env.local` is for local development. Production
credentials must not live there — turbo, Next.js, and various tools
auto-discover `*.env.local` files across the workspace, and one stray
copy of prod secrets pollutes every subprocess.

This package is the **only place** that touches prod credentials. They
live in `tooling/admin/.secrets/<env>.env` (gitignored) and are loaded
explicitly by the admin CLI when you opt in via `--env prod`.

## Safety properties

| Concern | Mitigation |
|---|---|
| Auto-loaded by other tools | Filename is `tooling/admin/.secrets/.env.<env>` — outside `**/.env.*local` glob, outside `apps/web/.env*`, and `tooling/` isn't searched by Next.js. Nothing else reads it. |
| Misplaced at the file-system level | **Doctor scanner** at `tooling/admin/scripts/check-secrets-location.sh` enforces a single rule: `.env.production` / `.env.preview` / `.env.staging` files may **only** exist inside `tooling/admin/.secrets/`. Anywhere else in the tree → error. Runs automatically as `predev` and `prebuild` (so `pnpm dev` and `pnpm build` fail-fast if a stray prod env exists anywhere), and on demand via `pnpm admin doctor`. |
| Committed by accident | **Three layers:** (1) `.gitignore` at repo root blocks `**/.secrets/`, `**/prod.env`, `**/.env.production`, etc. anywhere in the tree. (2) The `no-secret-files` pre-commit hook (`tooling/admin/scripts/check-secrets.sh`) refuses any staged file whose name OR contents look like a leaked credential (Vercel env-pull header, live Stripe keys, postgres URLs with embedded creds, AWS access keys, GitHub PATs). (3) `env pull` itself fails loudly if Vercel writes the file outside the expected `.secrets/` directory. |
| Run against prod by mistake | Default is `--env local`. Active env is printed on every command. |
| Untraceable use | `.secrets/audit.log` (gitignored) records every command + target env + timestamp. |
| Mutating action by mistake | Read-only `sql` subcommand by default. See "Future work" below. |

### Testing the safety net

```bash
# Runtime gate — pnpm dev refuses to start if a stray prod env is anywhere
echo "fake" > .env.production
pnpm run predev   # → "SECURITY: Production-shaped env file(s) found OUTSIDE ..."
pnpm admin doctor # → same scan, on demand

# Repo-root commit attempt — blocked by .gitignore
echo "DATABASE_URL=postgres://x:y@host/db" > prod.env
git add prod.env  # → "ignored by one of your .gitignore files"

# Force-stage attempt — blocked by the pre-commit content scanner
git add -f prod.env
git commit -m "leak"  # → "Refusing to commit. ... contains a Postgres URL with embedded credentials."
```

## Commands

```bash
# Pull prod env from Vercel into the secrets dir (requires Vercel CLI logged in)
pnpm admin env pull --env prod

# Ad-hoc SQL (defaults to local DB)
pnpm admin sql "SELECT count(*) FROM tool_job"

# Ad-hoc SQL against prod
pnpm admin sql --env prod "SELECT count(*) FROM organization"

# SQL from a file
pnpm admin sql --env prod --file ./reports/org-jobs.sql

# Show what env would be active without doing anything
pnpm admin env show --env prod
```

## What `--env` does

- `--env local` (default) — loads `apps/web/.env.local`. Hits your local Docker Postgres.
- `--env preview` — loads `tooling/admin/.secrets/.env.preview`. For testing reports against the preview branch DB before running them in prod.
- `--env prod` — loads `tooling/admin/.secrets/.env.production`. Production. Read carefully.

Filenames are deliberately the canonical Next.js shape so the doctor scanner can enforce a single rule across the whole tree: a `.env.production` file is allowed in **exactly one place** (`tooling/admin/.secrets/`) and nowhere else.

The CLI errors out if the secrets file is missing — it never falls back to a different env.

## Audit log

Every command writes a line to `tooling/admin/.secrets/audit.log`:

```text
2026-05-21T14:23:01Z env=prod cmd=sql sql="SELECT count(*) FROM..." rows=1
```

Useful for "did I really run that?" sanity checks.

## Future work

- `--write` flag + interactive confirm for mutating SQL (currently read-only enforcement is by convention only)
- Named reports (`pnpm admin db org-jobs`)
- Schema-aware queries via `@repo/database`'s Prisma client
